import { currentUser,auth } from "@clerk/nextjs/server";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const VERIFIED_USER_TTL = 30_000;
const verifiedUsers = new Map();
const userLookupsInFlight = new Map();

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
  if (existing) return existing;

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
  return request;
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
    console.log("STRAPI_API_TOKEN is not found");
    return null;
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
          return null;
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
      return null;
    }

    const lookupDuration = performance.now() - lookupStartedAt;
    const parseStartedAt = performance.now();
    const existingUserData = await existingUserResponse.json();
    const parseDuration = performance.now() - parseStartedAt;

    if (existingUserData.length > 0) {
      const existingUser = existingUserData[0];

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
    console.error(
      `[checkUser] Strapi request failed for ${STRAPI_URL}; ` +
        "authentication state was not changed."
    );
    return null;
  }
};
