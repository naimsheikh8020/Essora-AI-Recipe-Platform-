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
export async function getOrGenerateRecipe(formData) {
  const startedAt = performance.now();

  try {
    const authStartedAt = performance.now();
    const user = await checkUser();
    const authDuration = performance.now() - authStartedAt;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const recipeName = formData.get("recipeName");
    const requestedPantryFingerprint = formData.get("pantryFingerprint");
    if (!recipeName) {
      throw new Error("Recipe name is required");
    }

    const normalizedTitle = normalizeTitle(recipeName);
    const isPro = user.subscriptionTier === "pro";
    const pantryStartedAt = performance.now();
    const pantry = requestedPantryFingerprint
      ? await getAuthenticatedPantry(user)
      : null;
    const pantryDuration = performance.now() - pantryStartedAt;
    const pantryFingerprint = pantry?.fingerprint || null;
    const cacheKey = [
      String(user.id),
      normalizedTitle.toLowerCase(),
      pantryFingerprint || "saved",
    ].join(":");

    const cached = getRecipeDetailCache(cacheKey);
    if (cached) {
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
      { authDuration, pantryDuration, startedAt }
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
    console.error("❌ Error in getOrGenerateRecipe:", error);
    throw new Error(error.message || "Failed to load recipe");
  }
}

async function resolveRecipeDetail(
  formData,
  user,
  pantry,
  { authDuration, pantryDuration, startedAt }
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

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();

      if (searchData.data && searchData.data.length > 0) {
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
          recipeId: searchData.data[0].id,
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
        return result;
      }
    }

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
    const imageStartedAt = performance.now();
    const imageUrl = await fetchRecipeImage(normalizedTitle);
    console.info(
      `[recipe-detail] image=${Math.round(
        performance.now() - imageStartedAt
      )}ms`
    );

    // Step 4: Save generated recipe to database
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

    return {
      success: true,
      recipe: {
        ...recipeData,
        title: normalizedTitle,
        category,
        cuisine,
        imageUrl: imageUrl || "",
      },
      recipeId: createdRecipe.data.id,
      isSaved: false,
      fromDatabase: false,
      recommendationsLimit: isPro ? "unlimited" : 5,
      isPro,
      message: "Recipe generated and saved successfully!",
    };
  } catch (error) {
    console.error("❌ Error in recipe detail resolution:", error);
    throw new Error(error.message || "Failed to load recipe");
  }
}

// Save recipe to user's collection (bookmark)
export async function saveRecipeToCollection(formData) {
  try {
    const user = await checkUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const recipeId = formData.get("recipeId");
    if (!recipeId) {
      throw new Error("Recipe ID is required");
    }

    // Check if already saved
    const existingResponse = await fetch(
      `${STRAPI_URL}/api/saved-recipes?filters[user][id][$eq]=${user.id}&filters[recipe][id][$eq]=${recipeId}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (existingResponse.ok) {
      const existingData = await existingResponse.json();
      if (existingData.data && existingData.data.length > 0) {
        return {
          success: true,
          alreadySaved: true,
          message: "Recipe is already in your collection",
        };
      }
    }

    // Create saved recipe relation
    const saveResponse = await fetch(`${STRAPI_URL}/api/saved-recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          user: user.id,
          recipe: recipeId,
          savedAt: new Date().toISOString(),
        },
      }),
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      console.error("❌ Failed to save recipe:", errorText);
      throw new Error("Failed to save recipe to collection");
    }

    const savedRecipe = await saveResponse.json();
    console.log("✅ Recipe saved to user collection:", savedRecipe.data.id);

    return {
      success: true,
      alreadySaved: false,
      savedRecipe: savedRecipe.data,
      message: "Recipe saved to your collection!",
    };
  } catch (error) {
    console.error("❌ Error saving recipe to collection:", error);
    throw new Error(error.message || "Failed to save recipe");
  }
}

// Remove recipe from user's collection (unbookmark)
export async function removeRecipeFromCollection(formData) {
  try {
    const user = await checkUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const recipeId = formData.get("recipeId");
    if (!recipeId) {
      throw new Error("Recipe ID is required");
    }

    // Find saved recipe relation
    const searchResponse = await fetch(
      `${STRAPI_URL}/api/saved-recipes?filters[user][id][$eq]=${user.id}&filters[recipe][id][$eq]=${recipeId}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    if (!searchResponse.ok) {
      throw new Error("Failed to find saved recipe");
    }

    const searchData = await searchResponse.json();

    if (!searchData.data || searchData.data.length === 0) {
      return {
        success: true,
        message: "Recipe was not in your collection",
      };
    }

    // Delete saved recipe relation
    const savedRecipeId = searchData.data[0].id;
    const deleteResponse = await fetch(
      `${STRAPI_URL}/api/saved-recipes/${savedRecipeId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );

    if (!deleteResponse.ok) {
      throw new Error("Failed to remove recipe from collection");
    }

    console.log("✅ Recipe removed from user collection");

    return {
      success: true,
      message: "Recipe removed from your collection",
    };
  } catch (error) {
    console.error("❌ Error removing recipe from collection:", error);
    throw new Error(error.message || "Failed to remove recipe");
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