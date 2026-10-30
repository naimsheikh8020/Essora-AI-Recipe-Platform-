import { currentUser,auth } from "@clerk/nextjs/server";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

const fetchStrapiWithRetry = async (url, options, operation) => {
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

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    console.log("user is not found");
    return null;
  }

  if (!STRAPI_API_TOKEN) {
    console.log("STRAPI_API_TOKEN is not found");
    return null;
  }

  const {has} = await auth()
  const subscriptionTier = has({plan: "pro"}) ? "pro" : "free";

  try {
    // Check if user exists in Strapi
    const lookupStartedAt = performance.now();
    const existingUserResponse = await fetchStrapiWithRetry(
      `${STRAPI_URL}/api/users?filters[clerkId][$eq]=${encodeURIComponent(user.id)}&fields[0]=id&fields[1]=subscriptionTier&fields[2]=clerkId`,
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
    const existingUserData = await existingUserResponse.json();

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

      if (process.env.NODE_ENV === "development") {
        console.info(`[checkUser] lookup=${Math.round(lookupDuration)}ms`);
      }
      return { ...existingUser, subscriptionTier };
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
