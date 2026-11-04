"use server";

import { checkUser } from "@/lib/checkUser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { freeMealRecommendations, proTierLimit } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { fetchRecipeImage } from "@/lib/recipe-image-cache";
import { createHash } from "node:crypto";
import {
  clearRecipeDetailInFlight,
  getRecipeDetailCache,
  getRecipeDetailInFlight,
  setRecipeDetailCache,
  setRecipeDetailInFlight,
} from "@/lib/recipe-detail-cache";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function normalizeIngredientName(name) {
  return typeof name === "string" ? name.trim().toLowerCase() : "";
}

function normalizePantryIngredients(items) {
  const uniqueItems = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const name = normalizeIngredientName(item?.name);
    const id = item?.id ?? item?.documentId;

    if (!name) return;

    const current = uniqueItems.get(name);
    const hasId = id !== undefined && id !== null && String(id).trim();

    if (!current || (hasId && !current.id)) {
      uniqueItems.set(name, {
        id: hasId ? String(id).trim() : "",
        name,
      });
    }
  });

  return Array.from(
    new Set(
      Array.from(uniqueItems.values()).map(({ id, name }) =>
        id ? `id:${id}|name:${name}` : `name:${name}`
      )
    )
  ).sort();
}

function createPantryFingerprint(items) {
  return createHash("sha256")
    .update(JSON.stringify(normalizePantryIngredients(items)))
    .digest("hex");
}

async function getAuthenticatedPantry(authenticatedUser = null) {
  const user = authenticatedUser || (await checkUser());

  if (!user) {
    throw new Error("User not authenticated");
  }

  const pantryResponse = await fetch(
    `${STRAPI_URL}/api/pantry-items?filters[owner][id][$eq]=${user.id}`,
    {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      cache: "no-store",
    }
  );

  if (!pantryResponse.ok) {
    throw new Error("Failed to fetch pantry items");
  }

  const pantryData = await pantryResponse.json();
  const items = Array.isArray(pantryData.data) ? pantryData.data : [];
  const fingerprint = createPantryFingerprint(items);

  return {
    user,
    userId: String(user.id),
    items,
    fingerprint,
    ingredients: items
      .map((item) => item?.name)
      .filter((name) => typeof name === "string" && name.trim())
      .join(", "),
  };
}

export async function getPantryIngredients() {
  try {
    const pantry = await getAuthenticatedPantry();

    return {
      success: true,
      userId: pantry.userId,
      fingerprint: pantry.fingerprint,
      ingredients: pantry.items.map((item) => ({
        id: item?.id ?? item?.documentId ?? null,
        name: item?.name || "",
      })),
      isEmpty: pantry.items.length === 0,
    };
  } catch (error) {
    console.error("❌ Error fetching pantry ingredients:", error);
    throw new Error(error.message || "Failed to fetch pantry ingredients");
  }
}

// Helper function to normalize recipe title
function normalizeTitle(title) {
  return title
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Helper function to fetch image from Unsplash
// async function fetchRecipeImage(recipeName) {
//   try {
//     if (!UNSPLASH_ACCESS_KEY) {
//       console.warn("⚠️ UNSPLASH_ACCESS_KEY not set, skipping image fetch");
//       return "";
//     }

//     const searchQuery = `${recipeName}`;
//     const response = await fetch(
//       `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
//         searchQuery
//       )}&per_page=1&orientation=landscape`,
//       {
//         headers: {
//           Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
//         },
//       }
//     );
//     console.log("📊 Unsplash API rate limit:", {
//       limit: response.headers.get("X-Ratelimit-Limit"),
//       remaining: response.headers.get("X-Ratelimit-Remaining"),
//       status: response.status,
//     });

//     if (!response.ok) {
//       const errorBody = await response.text();

//       console.error("❌ Unsplash API error:", {
//         status: response.status,
//         body: errorBody,
//         recipeName,
//       });

//       return "";
//     }

//     if (!response.ok) {
//       const errorBody = await response.text();

//       console.error("❌ Unsplash API error:", {
//         status: response.status,
//         statusText: response.statusText,
//         body: errorBody,
//         recipeName,
//       });

//       return "";
//     }

//     const data = await response.json();

//     if (data.results && data.results.length > 0) {
//       const photo = data.results[0];
//       console.log("✅ Found Unsplash image:", photo.urls.regular);
//       return photo.urls.regular;
//     }

//     console.log("ℹ️ No Unsplash image found for:", recipeName);
//     return "";
//   } catch (error) {
//     console.error("❌ Error fetching Unsplash image:", error);
//     return "";
//   }
// }

// Get or generate recipe details
function createProgressReporter(onProgress) {
  let plan = [];
  let activeStage = "initializing";
  const completedStages = new Set();

  const report = (stage, status, message, nextPlan) => {
    if (status === "started") {
      activeStage = stage;
    }

    if (status === "updated" && Array.isArray(nextPlan)) {
      plan = nextPlan;
    }

    if (status === "completed" && stage !== "completed") {
      completedStages.add(stage);
    }

    if (typeof onProgress !== "function") return;

    const completedCount = completedStages.size;
    onProgress({
      type: "progress",
      stage,
      status,
      message,
      plan,
      completedStages: Array.from(completedStages),
      percent:
        stage === "completed"
          ? 100
          : plan.length
            ? Math.round((completedCount / plan.length) * 100)
            : 0,
    });
  };

  report.fail = (message) => {
    report(activeStage, "failed", message);
  };

  return report;
}

export async function getOrGenerateRecipe(formData) {
  return runRecipeRequest(formData);
}

export async function runRecipeRequest(formData, onProgress) {
  const startedAt = performance.now();
  const report = createProgressReporter(onProgress);

  try {
    const recipeName = formData.get("recipeName");
    const requestedPantryFingerprint = formData.get("pantryFingerprint");
    if (!recipeName) {
      throw new Error("Recipe name is required");
    }

    report("initializing", "started", "Initializing recipe request.");
    const initialPlan = [
      "initializing",
      "authentication",
      ...(requestedPantryFingerprint ? ["pantry"] : []),
      "recipe_lookup",
      "preparing",
      "completed",
    ];
    report("plan", "updated", null, initialPlan);

    report("initializing", "completed", "Recipe request initialized.");
    report("authentication", "started", "Checking user authentication.");
    const authStartedAt = performance.now();
    const user = await checkUser();
    const authDuration = performance.now() - authStartedAt;
    if (!user) {
      throw new Error("User not authenticated");
    }
    report("authentication", "completed", "Authentication verified.");

    const normalizedTitle = normalizeTitle(recipeName);
    const isPro = user.subscriptionTier === "pro";
    const pantryStartedAt = performance.now();
    if (requestedPantryFingerprint) {
      report("pantry", "started", "Checking pantry ingredients.");
    }
    const pantry = requestedPantryFingerprint
      ? await getAuthenticatedPantry(user)
      : null;
    const pantryDuration = performance.now() - pantryStartedAt;
    if (requestedPantryFingerprint) {
      report("pantry", "completed", "Pantry ingredients checked.");
    }
    const pantryFingerprint = pantry?.fingerprint || null;
    const cacheKey = [
      String(user.id),
      normalizedTitle.toLowerCase(),
      pantryFingerprint || "saved",
    ].join(":");

    const cached = getRecipeDetailCache(cacheKey);
    if (cached) {
      report("recipe_lookup", "started", "Checking whether the recipe already exists.");
      report("recipe_lookup", "completed", "Recipe loaded from cache.");
      report("preparing", "started", "Preparing recipe details.");
      report("preparing", "completed", "Recipe details prepared.");
      report("completed", "completed", "Recipe ready.");
      console.info(
        `[recipe-detail] cache-hit total=${Math.round(
          performance.now() - startedAt
        )}ms auth=${Math.round(authDuration)}ms pantry=${Math.round(
          pantryDuration
        )}ms`
      );
      return { ...cached, isPro };
    }

    const inFlight = getRecipeDetailInFlight(cacheKey);
    if (inFlight) {
      return await inFlight;
    }

    const request = resolveRecipeDetail(
      formData,
      user,
      pantry,
      { authDuration, pantryDuration, startedAt, report }
    );
    setRecipeDetailInFlight(cacheKey, request);

    try {
      const result = await request;
      if (result?.success) {
        setRecipeDetailCache(cacheKey, result);
      }
      return result;
    } finally {
      clearRecipeDetailInFlight(cacheKey, request);
    }
  } catch (error) {
    report.fail(error.message || "Recipe request failed.");
    console.error("❌ Error in getOrGenerateRecipe:", error);
    throw new Error(error.message || "Failed to load recipe");
  }
}

async function resolveRecipeDetail(
  formData,
  user,
  pantry,
  { authDuration, pantryDuration, startedAt, report }
) {
  try {
    const recipeName = formData.get("recipeName");
    const normalizedTitle = normalizeTitle(recipeName);
    const isPro = user.subscriptionTier === "pro";
    const pantryFingerprint = pantry?.fingerprint || null;
    const recipeFilters = [
      `filters[title][$eqi]=${encodeURIComponent(normalizedTitle)}`,
    ];

    if (pantryFingerprint) {
      recipeFilters.push(
        `filters[author][id][$eq]=${encodeURIComponent(user.id)}`,
        `filters[pantryFingerprint][$eq]=${encodeURIComponent(
          pantryFingerprint
        )}`
      );
    }

    report("recipe_lookup", "started", "Checking whether the recipe already exists.");
    const lookupStartedAt = performance.now();
    const searchResponse = await fetch(
      `${STRAPI_URL}/api/recipes?${recipeFilters.join("&")}&populate=*`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );
    const lookupDuration = performance.now() - lookupStartedAt;
    console.info(
      `[recipe-detail] strapi-lookup=${Math.round(
        lookupDuration
      )}ms auth=${Math.round(authDuration)}ms pantry=${Math.round(
        pantryDuration
      )}ms`
    );

    if (!searchResponse.ok) {
      throw new Error(
        `Failed to check existing recipes (${searchResponse.status})`
      );
    }

    const searchData = await searchResponse.json();

    if (searchData.data && searchData.data.length > 0) {
      report("recipe_lookup", "completed", "Recipe found in Strapi.");
      console.log("✅ Recipe found in database:", searchData.data[0].id);

      // Check if user has saved this recipe
      const savedRecipeResponse = await fetch(
        `${STRAPI_URL}/api/saved-recipes?filters[user][id][$eq]=${user.id}&filters[recipe][id][$eq]=${searchData.data[0].id}`,
        {
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          },
          cache: "no-store",
        }
      );

      let isSaved = false;
      if (savedRecipeResponse.ok) {
        const savedData = await savedRecipeResponse.json();
        isSaved = savedData.data && savedData.data.length > 0;
      }

      const result = {
        success: true,
        recipe: searchData.data[0],
        recipeId:
          searchData.data[0].documentId || searchData.data[0].id,
        recipeDocumentId: getRecipeDocumentId(searchData.data[0]),
        isSaved: isSaved,
        fromDatabase: true,
        isPro,
        message: "Recipe loaded from database",
      };
      console.info(
        `[recipe-detail] database-hit total=${Math.round(
          performance.now() - startedAt
        )}ms`
      );
      report("preparing", "started", "Preparing recipe details.");
      report("preparing", "completed", "Recipe details prepared.");
      report("completed", "completed", "Recipe ready.");
      return result;
    }

    report("plan", "updated", null, [
      "initializing",
      "authentication",
      ...(pantryFingerprint ? ["pantry"] : []),
      "recipe_lookup",
      "generation",
      "image",
      "persistence",
      "preparing",
      "completed",
    ]);
    report("recipe_lookup", "completed", "No existing recipe found.");
    report("generation", "started", "Generating recipe with Our AI Chef.");
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
    });

    const prompt = `
You are a professional chef and recipe expert. Generate a detailed recipe for: "${normalizedTitle}"

CRITICAL: The "title" field MUST be EXACTLY: "${normalizedTitle}" (no changes, no additions like "Classic" or "Easy")

Return ONLY a valid JSON object with this exact structure (no markdown, no explanations):
{
  "title": "${normalizedTitle}",
  "description": "Brief 2-3 sentence description of the dish",
  "category": "Must be ONE of these EXACT values: breakfast, lunch, dinner, snack, dessert",
  "cuisine": "The actual cuisine name as a string, such as Bangladeshi, Indian, Japanese, Korean, Thai, Vietnamese, Lebanese, Persian, Ethiopian, Nigerian, Italian, Mexican, Brazilian, Peruvian, Jamaican, Filipino, or another appropriate regional/traditional cuisine",
  "prepTime": "Time in minutes (number only)",
  "cookTime": "Time in minutes (number only)",
  "servings": "Number of servings (number only)",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity with unit",
      "category": "Protein|Vegetable|Spice|Dairy|Grain|Other"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "title": "Brief step title",
      "instruction": "Detailed step instruction",
      "tip": "Optional cooking tip for this step"
    }
  ],
  "nutrition": {
    "calories": "calories per serving",
    "protein": "grams",
    "carbs": "grams",
    "fat": "grams"
  },
  "tips": [
    "General cooking tip 1",
    "General cooking tip 2",
    "General cooking tip 3"
  ],
  "substitutions": [
    {
      "original": "ingredient name",
      "alternatives": ["substitute 1", "substitute 2"]
    }
  ]
}

IMPORTANT RULES FOR CATEGORY:
- Breakfast items (pancakes, eggs, cereal, etc.) → "breakfast"
- Main meals for midday (sandwiches, salads, pasta, etc.) → "lunch"
- Main meals for evening (heavier dishes, roasts, etc.) → "dinner"
- Light items between meals (chips, crackers, fruit, etc.) → "snack"
- Sweet treats (cakes, cookies, ice cream, etc.) → "dessert"

IMPORTANT RULES FOR CUISINE:
- Choose the cuisine that authentically matches the dish.
- Regional, traditional, and fusion cuisines are valid.
- Consider cuisines from South Asia, East Asia, Southeast Asia, the Middle East,
  Europe, Africa, North America, South America, the Caribbean, and Oceania.
- If uncertain, use "International" or "Fusion" rather than inventing a classification.

Guidelines:
- Make ingredients realistic and commonly available
- Instructions should be clear and beginner-friendly
- Include 6-10 detailed steps
- Provide practical cooking tips
- Estimate realistic cooking times
- Keep total instructions under 12 steps
`;

    const geminiStartedAt = performance.now();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.info(
      `[recipe-detail] gemini=${Math.round(
        performance.now() - geminiStartedAt
      )}ms`
    );
    report("generation", "completed", "Recipe generated with Gemini.");

    // Parse JSON response
    let recipeData;
    try {
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      recipeData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Failed to generate recipe. Please try again.");
    }

    // FORCE the title to be our normalized version
    recipeData.title = normalizedTitle;

    // Validate and sanitize category
    const validCategories = [
      "breakfast",
      "lunch",
      "dinner",
      "snack",
      "dessert",
    ];
    const category = validCategories.includes(
      recipeData.category?.toLowerCase()
    )
      ? recipeData.category.toLowerCase()
      : "dinner";

    // Keep the model's free-form cuisine classification intact.
    const cuisine =
      typeof recipeData.cuisine === "string" && recipeData.cuisine.trim()
        ? recipeData.cuisine.trim()
        : "International";

    // Step 3: Fetch image from Unsplash
    report("image", "started", "Finding a recipe image.");
    const imageStartedAt = performance.now();
    const imageUrl = await fetchRecipeImage(normalizedTitle);
    console.info(
      `[recipe-detail] image=${Math.round(
        performance.now() - imageStartedAt
      )}ms`
    );
    report("image", "completed", "Recipe image selected.");

    // Step 4: Save generated recipe to database
    report("persistence", "started", "Saving recipe to Strapi.");
    const strapiRecipeData = {
      data: {
        title: normalizedTitle,
        description: recipeData.description,
        cuisine,
        pantryFingerprint,
        category,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prepTime: Number(recipeData.prepTime),
        cookTime: Number(recipeData.cookTime),
        servings: Number(recipeData.servings),
        nutrition: recipeData.nutrition,
        tips: recipeData.tips,
        substitutions: recipeData.substitutions,
        imageUrl: imageUrl || "",
        isPublic: true,
        author: user.id,
      },
    };

    const saveStartedAt = performance.now();
    const createRecipeResponse = await fetch(`${STRAPI_URL}/api/recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify(strapiRecipeData),
    });
    console.info(
      `[recipe-detail] strapi-save=${Math.round(
        performance.now() - saveStartedAt
      )}ms`
    );

    if (!createRecipeResponse.ok) {
      const errorText = await createRecipeResponse.text();
      console.error("❌ Failed to save recipe:", {
        status: createRecipeResponse.status,
        response: errorText,
      });
      throw new Error(
        `Failed to save recipe to database (${createRecipeResponse.status})`
      );
    }

    const createdRecipe = await createRecipeResponse.json();
    if (!createdRecipe?.data?.id) {
      console.error("❌ Strapi returned an invalid recipe record:", createdRecipe);
      throw new Error("Recipe save returned an invalid response");
    }

    console.log("✅ Recipe saved to database:", createdRecipe.data.id);
    report("persistence", "completed", "Recipe saved to Strapi.");
    report("preparing", "started", "Preparing recipe details.");

    const recipeResult = {
      success: true,
      recipe: {
        ...recipeData,
        title: normalizedTitle,
        category,
        cuisine,
        imageUrl: imageUrl || "",
      },
      recipeId:
        createdRecipe.data.documentId || createdRecipe.data.id,
      recipeDocumentId: getRecipeDocumentId(createdRecipe.data),
      isSaved: false,
      fromDatabase: false,
      recommendationsLimit: isPro ? "unlimited" : 5,
      isPro,
      message: "Recipe generated and saved successfully!",
    };
    report("preparing", "completed", "Recipe details prepared.");
    report("completed", "completed", "Recipe ready.");
    return recipeResult;
  } catch (error) {
    console.error("❌ Error in recipe detail resolution:", error);
    throw new Error(error.message || "Failed to load recipe");
  }
}

// Save recipe to user's collection (bookmark)

const savedRecipeLocks = new Map();

function getRelationDocumentId(relation) {
  return relation?.documentId || relation?.data?.documentId || null;
}

function getRelationId(relation) {
  return relation?.id || relation?.data?.id || null;
}

function getRecipeDocumentId(recipe) {
  return recipe?.documentId || recipe?.data?.documentId || null;
}

function actionError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getActionFailure(error) {
  if (error?.code && error?.message) {
    return {
      success: false,
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof TypeError || error?.name === "FetchError") {
    return {
      success: false,
      code: "NETWORK_ERROR",
      message: "The recipe service is temporarily unavailable. Please try again.",
    };
  }

  return {
    success: false,
    code: "INTERNAL_ERROR",
    message: "Unable to update your recipe collection. Please try again.",
  };
}

async function withSavedRecipeLock(key, callback) {
  const previous = savedRecipeLocks.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  savedRecipeLocks.set(key, current);
  await previous;

  try {
    return await callback();
  } finally {
    release();
    if (savedRecipeLocks.get(key) === current) {
      savedRecipeLocks.delete(key);
    }
  }
}


export async function saveRecipeToCollection(formData) {
  const totalStart = performance.now();
  const timings = {};

  // Measure individual operations
  async function measure(label, callback) {
    const start = performance.now();

    try {
      return await callback();
    } finally {
      timings[label] = `${Math.round(performance.now() - start)}ms`;
    }
  }

  try {
    // 1. Authenticate user
    const user = await measure("checkUser", () => checkUser());

    if (!user) {
      return {
        success: false,
        code: "UNAUTHENTICATED",
        message: "Please sign in to save recipes.",
      };
    }

    const recipeId = String(formData.get("recipeId") || "").trim();
    const requestedDocumentId = String(
      formData.get("recipeDocumentId") || ""
    ).trim();

    if (!recipeId && !requestedDocumentId) {
      return {
        success: false,
        code: "INVALID_RECIPE",
        message: "A valid recipe is required.",
      };
    }

    const identifier = requestedDocumentId || recipeId;
    console.info("[SAVE RECIPE INPUT]", {
      identifierType: /^\d+$/.test(identifier) ? "numeric-id" : "documentId",
      hasExplicitDocumentId: Boolean(requestedDocumentId),
    });

    const headers = {
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      "Content-Type": "application/json",
    };

    // Detail responses provide the Strapi documentId. Numeric IDs remain
    // supported for older callers and use the verified lookup fallback.
    let recipeDocumentId = /^\d+$/.test(identifier) ? null : identifier;
    if (!recipeDocumentId) {
      const recipeResult = await measure("recipeLookup", async () => {
        const response = await fetch(
          `${STRAPI_URL}/api/recipes?filters[id][$eq]=${encodeURIComponent(
            identifier
          )}&fields[0]=id&fields[1]=documentId&pagination[pageSize]=1`,
          {
            headers,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw actionError(
            response.status === 404 ? "RECIPE_NOT_FOUND" : "STRAPI_ERROR",
            response.status === 404
              ? "Recipe was not found."
              : `Recipe lookup failed: HTTP ${response.status}`
          );
        }

        return response.json();
      });

      recipeDocumentId = recipeResult.data?.[0]?.documentId || null;
      if (!recipeDocumentId) {
        throw actionError("RECIPE_NOT_FOUND", "Recipe was not found.");
      }
    }

    return await withSavedRecipeLock(`${user.id}:${recipeDocumentId}`, async () => {
      const existingResult = await measure("duplicateCheck", async () => {
        const response = await fetch(
          `${STRAPI_URL}/api/saved-recipes?filters[user][id][$eq]=${encodeURIComponent(
            user.id
          )}&filters[recipe][documentId][$eq]=${encodeURIComponent(
            recipeDocumentId
          )}&fields[0]=id&fields[1]=documentId&pagination[pageSize]=1&pagination[withCount]=false`,
          {
            headers,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();

          console.error("[SAVE RECIPE STRAPI DUPLICATE LOOKUP ERROR]", {
            status: response.status,
            statusText: response.statusText,
            response: errorBody,
          });

          throw actionError(
            response.status === 403
              ? "PERMISSION_DENIED"
              : "STRAPI_ERROR",
            response.status === 403
              ? "You do not have permission to check saved recipes."
              : `Saved recipe duplicate lookup failed: HTTP ${response.status}`
          );
        }

        return response.json();
      });

      if (existingResult.data?.length > 0) {
        return {
          success: true,
          data: { alreadySaved: true },
          alreadySaved: true,
          message: "Recipe is already in your collection",
        };
      }

      const savedRecipe = await measure("createSavedRecipe", async () => {
        const postStartedAt = performance.now();
        const response = await fetch(
          `${STRAPI_URL}/api/saved-recipes?populate[recipe][fields][0]=documentId&populate[user][fields][0]=id`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              data: {
                user: user.id,
                recipe: { connect: [recipeDocumentId] },
                saveAt: new Date().toISOString(),
              },
            }),
          }
        );
        timings.createPost = `${Math.round(
          performance.now() - postStartedAt
        )}ms`;

        const responseJsonStartedAt = performance.now();
        const result = await response.json();
        timings.createPostResponseJson = `${Math.round(
          performance.now() - responseJsonStartedAt
        )}ms`;

        if (!response.ok) {
          console.error("Strapi save error:", result);
          throw actionError(
            response.status === 403 ? "PERMISSION_DENIED" : "STRAPI_ERROR",
            response.status === 403
              ? "You do not have permission to save this recipe."
              : "Recipe could not be saved."
          );
        }

        if (!result.data?.id || !result.data?.documentId) {
          throw actionError(
            "PERSISTENCE_ERROR",
            "Recipe could not be saved correctly."
          );
        }

        let persistedRecipe = result.data;
        const hasPersistedRelations =
          getRelationDocumentId(persistedRecipe.recipe) &&
          String(getRelationId(persistedRecipe.user)) === String(user.id);

        if (!hasPersistedRelations) {
          const verificationStartedAt = performance.now();
          const verificationResponse = await fetch(
            `${STRAPI_URL}/api/saved-recipes/${encodeURIComponent(
              result.data.documentId
            )}?populate[recipe][fields][0]=documentId&populate[user][fields][0]=id`,
            {
              headers,
              cache: "no-store",
            }
          );
          timings.createRelationVerification = `${Math.round(
            performance.now() - verificationStartedAt
          )}ms`;
          const verification = await verificationResponse.json();

          if (
            !verificationResponse.ok ||
            !getRelationDocumentId(verification.data?.recipe) ||
            String(getRelationId(verification.data?.user)) !== String(user.id)
          ) {
            throw actionError(
              "PERSISTENCE_ERROR",
              "Recipe could not be saved correctly."
            );
          }

          persistedRecipe = verification.data;
        }

        return persistedRecipe;
      });

      return {
        success: true,
        data: { savedRecipe, alreadySaved: false },
        alreadySaved: false,
        savedRecipe,
        message: "Recipe saved successfully!",
      };
    });

  } catch (error) {
    const failure = getActionFailure(error);
    if (failure.code === "INTERNAL_ERROR") {
      console.error("[SAVE RECIPE ERROR]", {
        code: error?.code || "UNKNOWN",
        message: error?.message || "Unknown error",
      });
    }
    return failure;

  } finally {
    timings.total = `${Math.round(
      performance.now() - totalStart
    )}ms`;

    console.log("[SAVE RECIPE TIMING]", timings);
  }
}



// Remove recipe from user's collection (unbookmark)
export async function removeRecipeFromCollection(formData) {
  const totalStart = performance.now();
  const timings = {};

  async function measure(label, callback) {
    const start = performance.now();
    try {
      return await callback();
    } finally {
      timings[label] = `${Math.round(performance.now() - start)}ms`;
    }
  }

  try {
    const user = await measure("checkUser", () => checkUser());
    if (!user) {
      return {
        success: false,
        code: "UNAUTHENTICATED",
        message: "Please sign in to manage saved recipes.",
      };
    }

    const recipeId = String(formData.get("recipeId") || "").trim();
    const requestedDocumentId = String(
      formData.get("recipeDocumentId") || ""
    ).trim();
    const identifier = requestedDocumentId || recipeId;

    if (!identifier) {
      return {
        success: false,
        code: "INVALID_RECIPE",
        message: "A valid recipe is required.",
      };
    }
    console.info("[REMOVE RECIPE INPUT]", {
      identifierType: /^\d+$/.test(identifier) ? "numeric-id" : "documentId",
      hasExplicitDocumentId: Boolean(requestedDocumentId),
    });

    // Find saved recipe relation
    const recipeFilter = /^\d+$/.test(identifier)
      ? `filters[recipe][id][$eq]=${encodeURIComponent(identifier)}`
      : `filters[recipe][documentId][$eq]=${encodeURIComponent(identifier)}`;
    const savedRecipeLookupStartedAt = performance.now();
    const searchResponse = await fetch(
      `${STRAPI_URL}/api/saved-recipes?filters[user][id][$eq]=${encodeURIComponent(
        user.id
      )}&${recipeFilter}&fields[0]=id&fields[1]=documentId&pagination[pageSize]=1&pagination[withCount]=false`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );
    timings.savedRecipeLookup = `${Math.round(
      performance.now() - savedRecipeLookupStartedAt
    )}ms`;

    if (!searchResponse.ok) {
      const errorBody = await searchResponse.text();

      console.error("[REMOVE RECIPE STRAPI LOOKUP ERROR]", {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        response: errorBody,
      });

      throw actionError(
        searchResponse.status === 403
          ? "PERMISSION_DENIED"
          : "STRAPI_ERROR",
        searchResponse.status === 403
          ? "You do not have permission to manage this saved recipe."
          : `Saved recipe lookup failed: HTTP ${searchResponse.status}`
      );
    }

    const searchData = await searchResponse.json();

    if (!searchData.data?.length) {
      return {
        success: true,
        data: { removed: false },
        message: "Recipe was not in your collection",
      };
    }

    // Delete saved recipe relation
    const savedRecipeId = searchData.data[0].documentId;
    if (!savedRecipeId) {
      throw actionError(
        "PERSISTENCE_ERROR",
        "Saved recipe could not be identified."
      );
    }
    const deleteStartedAt = performance.now();
    const deleteResponse = await fetch(
      `${STRAPI_URL}/api/saved-recipes/${savedRecipeId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );
    timings.deleteSavedRecipe = `${Math.round(
      performance.now() - deleteStartedAt
    )}ms`;

    if (!deleteResponse.ok) {
      throw actionError(
        deleteResponse.status === 403
          ? "PERMISSION_DENIED"
          : "STRAPI_ERROR",
        deleteResponse.status === 403
          ? "You do not have permission to remove this recipe."
          : "Recipe could not be removed."
      );
    }

    return {
      success: true,
      data: { removed: true },
      message: "Recipe removed from your collection",
    };
  } catch (error) {
    const failure = getActionFailure(error);
    if (failure.code === "INTERNAL_ERROR") {
      console.error("[REMOVE RECIPE ERROR]", {
        code: error?.code || "UNKNOWN",
        message: error?.message || "Unknown error",
      });
    }
    return failure;
  } finally {
    timings.total = `${Math.round(performance.now() - totalStart)}ms`;
    console.log("[REMOVE RECIPE TIMING]", timings);
  }
}

// Get recipes based on pantry ingredients

export async function getRecipesByPantryIngredients(expectedFingerprint) {
  try {
    // 1. Authenticate user and read the current pantry on the server.
    const pantry = await getAuthenticatedPantry();
    const { user, fingerprint, ingredients } = pantry;

    if (expectedFingerprint && expectedFingerprint !== fingerprint) {
      return {
        success: false,
        stale: true,
        userId: pantry.userId,
        fingerprint,
        message: "Pantry changed. Refreshing recipe suggestions.",
      };
    }

    if (!ingredients) {
      return {
        success: false,
        userId: pantry.userId,
        fingerprint,
        message: "Your pantry is empty. Add ingredients first!",
      };
    }

    // 2. Arcjet rate limit
    const isPro = user.subscriptionTier === "pro";
    const arcjetClient = isPro ? proTierLimit : freeMealRecommendations;

    const req = await request();

    const decision = await arcjetClient.protect(req, {
      userId: user.clerkId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw new Error(
          `Monthly AI recipe limit reached. ${isPro ? "Please contact support." : "Upgrade to Pro!"
          }`
        );
      }

      throw new Error("Request denied");
    }
    console.log("🥘 Finding recipes for ingredients:", ingredients);

    // 4. Generate recipes with Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
    });

    const prompt = `
You are a professional chef.

Given these available ingredients:
${ingredients}

Suggest exactly 5 realistic recipes that can be made primarily with these ingredients.

It is okay if recipes require 1-2 common pantry staples such as salt, pepper, or oil.

Return ONLY a valid JSON array. Do not include markdown or explanations.

[
  {
    "title": "Recipe name",
    "description": "Brief 1-2 sentence description",
    "matchPercentage": 85,
    "missingIngredients": ["ingredient1", "ingredient2"],
    "category": "breakfast|lunch|dinner|snack|dessert",
    "cuisine": "The actual cuisine name as a string; use a regional, traditional, or fusion cuisine when appropriate, or International/Fusion when uncertain",
    "prepTime": 20,
    "cookTime": 30,
    "servings": 4
  }
]

Rules:
- matchPercentage must be between 70 and 100.
- missingIngredients should contain only necessary missing ingredients.
- Choose an authentic cuisine from any region of the world, including South Asia,
  East Asia, Southeast Asia, the Middle East, Europe, Africa, North America,
  South America, the Caribbean, or Oceania. Use the actual cuisine name as a
  string, and use International or Fusion when uncertain.
- Sort recipes by matchPercentage descending.
- Make recipes realistic and delicious.
- Use numeric values for prepTime, cookTime, servings and matchPercentage.
- Return exactly 5 recipes.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // 5. Parse Gemini response
    let recipeSuggestions;

    try {
      const cleanText = generatedText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      recipeSuggestions = JSON.parse(cleanText);

      if (!Array.isArray(recipeSuggestions)) {
        throw new Error("Gemini response is not an array");
      }

      if (recipeSuggestions.length === 0) {
        throw new Error("No recipes were generated");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", generatedText);

      throw new Error(
        "Failed to generate recipe suggestions. Please try again."
      );
    }

    // 6. Validate recipe data
    const validRecipes = recipeSuggestions.filter(
      (recipe) =>
        recipe &&
        typeof recipe.title === "string" &&
        recipe.title.trim().length > 0
    );

    if (validRecipes.length === 0) {
      throw new Error("Gemini returned no valid recipes.");
    }

    // 7. Fetch Unsplash images for all recipes
    console.log("🖼️ Fetching recipe images from Unsplash...");

    const recipesWithImages = await Promise.all(
      validRecipes.map(async (recipe) => {
        const imageUrl = await fetchRecipeImage(recipe.title);

        return {
          ...recipe,
          imageUrl,
        };
      })
    );

    // 8. Log image results
    console.log(
      "🍽️ Recipe image results:",
      recipesWithImages.map((recipe) => ({
        title: recipe.title,
        hasImage: Boolean(recipe.imageUrl),
      }))
    );

    // 9. Return final response
    return {
      success: true,
      userId: pantry.userId,
      fingerprint,
      recipes: recipesWithImages,
      ingredientsUsed: ingredients,
      recommendationsLimit: isPro ? "unlimited" : 5,
      message: `Found ${recipesWithImages.length} recipes you can make!`,
    };
  } catch (error) {
    console.error(
      "❌ Error in getRecipesByPantryIngredients:",
      error
    );

    throw new Error(
      error.message || "Failed to get recipe suggestions"
    );
  }
}


// Get user's saved recipes
export async function getSavedRecipes() {
  try {
    const user = await checkUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Fetch saved recipes with populated recipe data
    const response = await fetch(
      `${STRAPI_URL}/api/saved-recipes?filters[user][id][$eq]=${user.id}&populate[recipe][populate]=*&sort=savedAt:desc`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch saved recipes");
    }

    const data = await response.json();

    // Extract recipes from saved-recipes relations
    const recipes = data.data
      .map((savedRecipe) => savedRecipe.recipe)
      .filter(Boolean); // Remove any null recipes

    return {
      success: true,
      recipes,
      count: recipes.length,
    };
  } catch (error) {
    console.error("Error fetching saved recipes:", error);
    throw new Error(error.message || "Failed to load saved recipes");
  }
}