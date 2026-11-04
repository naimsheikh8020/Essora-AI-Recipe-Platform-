import { currentUser,auth } from "@clerk/nextjs/server";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const VERIFIED_USER_TTL = 30_000;
const verifiedUsers = new Map();
const userLookupsInFlight = new Map();

function createStrapiError(message, cause) {
  const error = new Error(message);
  error.code = "STRAPI_UNAVAILABLE";
  error.cause = cause;
  return error;
}

const fetchStrapiWithRetryUncoalesced = async (url, options, operation) => {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (process.env.NODE_ENV === "development") {
        console.error(
          `[checkUser] ${operation} request failed ` +
            `(attempt ${attempt}/2): ${error.message}`
        );
      }

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }
  }

  throw lastError;
};

const fetchStrapiWithRetry = (url, options, operation) => {
  if (operation !== "user lookup") {
    return fetchStrapiWithRetryUncoalesced(url, options, operation);
  }

  const existing = userLookupsInFlight.get(url);
  if (existing) {
    return existing.then((response) => response.clone());
  }

  const request = fetchStrapiWithRetryUncoalesced(url, options, operation);
  userLookupsInFlight.set(url, request);
  request.then(() => {
    if (userLookupsInFlight.get(url) === request) {
      userLookupsInFlight.delete(url);
    }
  }, () => {
    if (userLookupsInFlight.get(url) === request) {
      userLookupsInFlight.delete(url);
    }
  });
  return request.then((response) => response.clone());
};

export const checkUser = async (requestId = "unattributed") => {
  const startedAt = performance.now();
  const authStartedAt = performance.now();
  const { userId, has } = await auth();
  const authDuration = performance.now() - authStartedAt;

  if (!userId) {
    console.log("user is not found");
    return null;
  }

  if (!STRAPI_API_TOKEN) {
    throw createStrapiError("Recipe service is not configured.");
  }

  const subscriptionTier = has({plan: "pro"}) ? "pro" : "free";
  try {
    const cached = verifiedUsers.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      if (cached.user.subscriptionTier !== subscriptionTier) {
        const updateResponse = await fetch(
          `${STRAPI_URL}/api/users/${cached.user.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${STRAPI_API_TOKEN}`,
            },
            body: JSON.stringify({ subscriptionTier }),
          }
        );

        if (!updateResponse.ok) {
          throw createStrapiError(
            "Recipe service could not refresh your account."
          );
        }

        cached.user = { ...cached.user, subscriptionTier };
      }

      return { ...cached.user, clerkId: userId, subscriptionTier };
    }

    verifiedUsers.delete(userId);

    // Check if user exists in Strapi
    const lookupStartedAt = performance.now();
    const existingUserResponse = await fetchStrapiWithRetry(
      `${STRAPI_URL}/api/users?filters[clerkId][$eq]=${encodeURIComponent(userId)}&fields[0]=id&fields[1]=subscriptionTier&pagination[pageSize]=1`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      },
      "user lookup"
    );

    if (!existingUserResponse.ok) {
      const errorText = await existingUserResponse.text();

      console.error("Strapi error response:", errorText);
      throw createStrapiError(
        `Recipe service returned HTTP ${existingUserResponse.status}.`
      );
    }

    const lookupDuration = performance.now() - lookupStartedAt;
    const parseStartedAt = performance.now();
    const existingUserPayload = await existingUserResponse.json();
    const parseDuration = performance.now() - parseStartedAt;
    const existingUsers = Array.isArray(existingUserPayload)
      ? existingUserPayload
      : existingUserPayload?.data || [];

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0]?.attributes
        ? { id: existingUsers[0].id, ...existingUsers[0].attributes }
        : existingUsers[0];

      // Update subscription tier if changed
      if (existingUser.subscriptionTier !== subscriptionTier) {
        await fetch(`${STRAPI_URL}/api/users/${existingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          },
          body: JSON.stringify({ subscriptionTier }),
        });
      }

      verifiedUsers.set(userId, {
        user: { ...existingUser },
        expiresAt: Date.now() + VERIFIED_USER_TTL,
      });

      if (process.env.NODE_ENV === "development") {
        console.info(
          `[checkUser] requestId=${requestId} total=${Math.round(performance.now() - startedAt)}ms ` +
            `auth=${Math.round(authDuration)}ms ` +
            `strapiLookup=${Math.round(lookupDuration)}ms responseJson=${Math.round(parseDuration)}ms`
        );
      }
      return { ...existingUser, clerkId: userId, subscriptionTier };
    }

    const clerkStartedAt = performance.now();
    const user = await currentUser();
    const clerkDuration = performance.now() - clerkStartedAt;
    if (!user || user.id !== userId) {
      return null;
    }

    // Get authenticated role
    const rolesResponse = await fetch(
      `${STRAPI_URL}/api/users-permissions/roles`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );

    const rolesData = await rolesResponse.json();

    const authenticatedRole = rolesData.roles.find(
      (role) => role.type === "authenticated"
    );

    if (!authenticatedRole) {
      console.error("❌ Authenticated role not found");
      return null;
    }

    // Create new user
    const userData = {
      username:
        user.username || user.emailAddresses[0].emailAddress.split("@")[0],
      email: user.emailAddresses[0].emailAddress,
      password: `clerk_managed_${user.id}_${Date.now()}`,
      confirmed: true,
      blocked: false,
      role: authenticatedRole.id,
      clerkId: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl || "",
      subscriptionTier,
    };

    const newUserResponse = await fetch(`${STRAPI_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify(userData),
    });

    if (!newUserResponse.ok) {
      const errorText = await newUserResponse.text();

      console.error("❌ Error creating user:", errorText);
      return null;
    }

    const newUser = await newUserResponse.json();

    return newUser;
  } catch (error) {
    if (error?.code === "STRAPI_UNAVAILABLE") {
      throw error;
    }

    console.error(
      `[checkUser] Strapi request failed for ${STRAPI_URL}; ` +
        "authentication state was not changed.",
      error
    );
    throw createStrapiError(
      "Recipe service is temporarily unavailable. Please try again.",
      error
    );
  }
};
