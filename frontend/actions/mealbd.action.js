"use server";

import {
  getStaticRecipesByArea,
  getStaticRecipeById,
  normalizeCuisineName,
} from "@/lib/data/index.js";

const MEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";

// Get random recipe of the day
export async function getRecipeOfTheDay() {
  try {
    const response = await fetch(`${MEALDB_BASE}/random.php`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recipe of the day");
    }

    const data = await response.json();
    return {
      success: true,
      recipe: data.meals[0],
    };
  } catch (error) {
    console.error("Error fetching recipe of the day:", error);
    throw new Error(error.message || "Failed to load recipe");
  }
}

// Get meals by category
export async function getMealsByCategory(category) {
  try {
    const response = await fetch(`${MEALDB_BASE}/filter.php?c=${category}`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error("Failed to fetch meals");
    }

    const data = await response.json();
    return {
      success: true,
      meals: data.meals || [],
      category,
    };
  } catch (error) {
    console.error("Error fetching meals by category:", error);
    throw new Error(error.message || "Failed to load meals");
  }
}

// Get all categories
export async function getCategories() {
  try {
    const response = await fetch(`${MEALDB_BASE}/list.php?c=list`, {
      next: { revalidate: 604800 }, // Cache for 1 week (categories rarely change)
    });

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await response.json();
    return {
      success: true,
      categories: data.meals || [],
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error(error.message || "Failed to load categories");
  }
}

// Get all areas/cuisines
export async function getAreas() {
  try {
    const response = await fetch(`${MEALDB_BASE}/list.php?a=list`, {
      next: { revalidate: 604800 }, // Cache for 1 week
    });

    if (!response.ok) {
      throw new Error("Failed to fetch areas");
    }

    const data = await response.json();
    return {
      success: true,
      areas: data.meals || [],
    };
  } catch (error) {
    console.error("Error fetching areas:", error);
    throw new Error(error.message || "Failed to load areas");
  }
}


// //Get recipe details by ID
// export async function getRecipeDetails(mealId) {
//   try {
//     if (!mealId || !/^\d+$/.test(String(mealId))) {
//       return {
//         success: false,
//         message: "Invalid recipe ID",
//       };
//     }

//     const response = await fetch(
//       `${MEALDB_BASE}/lookup.php?i=${encodeURIComponent(mealId)}`
//     );

//     if (!response.ok) {
//       throw new Error("Failed to fetch recipe details");
//     }

//     const data = await response.json();
//     const meal = data.meals?.[0];

//     if (!meal) {
//       return {
//         success: false,
//         message: "Recipe not found",
//       };
//     }

//     const ingredients = [];

//     for (let i = 1; i <= 20; i++) {
//       const ingredient = meal[`strIngredient${i}`]?.trim();
//       const measure = meal[`strMeasure${i}`]?.trim();

//       if (ingredient) {
//         ingredients.push({
//           name: ingredient,
//           measure: measure || "",
//         });
//       }
//     }

//     return {
//       success: true,
//       recipe: {
//         id: meal.idMeal,
//         name: meal.strMeal,
//         image: meal.strMealThumb,
//         category: meal.strCategory,
//         area: meal.strArea,
//         country: meal.strCountry,
//         instructions: meal.strInstructions,
//         ingredients,
//         tags: meal.strTags
//           ? meal.strTags.split(",").map((tag) => tag.trim())
//           : [],
//         youtube: meal.strYoutube,
//         source: meal.strSource,
//       },
//     };
//   } catch (error) {
//     console.error("getRecipeDetails error:", error);

//     return {
//       success: false,
//       message: "Unable to load recipe details",
//     };
//   }
// }


export async function getRecipeDetails(mealId) {
  try {
    // 1. Validate the recipe ID.
    if (!mealId) {
      return {
        success: false,
        message: "Invalid recipe ID",
      };
    }

    const id = String(mealId);

    // 2. Check all local static recipes first.
    const staticRecipe = getStaticRecipeById(id);

    if (staticRecipe) {
      const ingredients = [];

      for (let i = 1; i <= 20; i++) {
        const ingredient = staticRecipe[`strIngredient${i}`]?.trim();
        const measure = staticRecipe[`strMeasure${i}`]?.trim();

        if (ingredient) {
          ingredients.push({
            name: ingredient,
            measure: measure || "",
          });
        }
      }

      return {
        success: true,
        recipe: {
          id: staticRecipe.idMeal,
          name: staticRecipe.strMeal,
          image: staticRecipe.strMealThumb,
          category: staticRecipe.strCategory,
          area: staticRecipe.strArea,
          country: staticRecipe.strArea,
          instructions: staticRecipe.strInstructions,
          ingredients,
          tags: staticRecipe.strTags
            ? staticRecipe.strTags.split(",").map((tag) => tag.trim())
            : [],
          youtube: staticRecipe.strYoutube || "",
          source: staticRecipe.strSource || "",
        },
      };
    }

    // 3. Validate IDs for TheMealDB.
    // TheMealDB recipe IDs are numeric; local static IDs can be strings.
    if (!/^\d+$/.test(id)) {
      return {
        success: false,
        message: "Invalid recipe ID",
      };
    }

    // 4. Fetch recipe details from TheMealDB.
    const response = await fetch(
      `${MEALDB_BASE}/lookup.php?i=${encodeURIComponent(id)}`,
      {
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recipe details");
    }

    const data = await response.json();
    const meal = data.meals?.[0];

    if (!meal) {
      return {
        success: false,
        message: "Recipe not found",
      };
    }

    // 5. Extract ingredients and measurements.
    const ingredients = [];

    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`]?.trim();
      const measure = meal[`strMeasure${i}`]?.trim();

      if (ingredient) {
        ingredients.push({
          name: ingredient,
          measure: measure || "",
        });
      }
    }

    // 6. Return a consistent recipe structure.
    return {
      success: true,
      recipe: {
        id: meal.idMeal,
        name: meal.strMeal,
        image: meal.strMealThumb,
        category: meal.strCategory,
        area: meal.strArea,
        country: meal.strArea,
        instructions: meal.strInstructions,
        ingredients,
        tags: meal.strTags
          ? meal.strTags.split(",").map((tag) => tag.trim())
          : [],
        youtube: meal.strYoutube || "",
        source: meal.strSource || "",
      },
    };
  } catch (error) {
    console.error("getRecipeDetails error:", error);

    return {
      success: false,
      message: "Unable to load recipe details",
    };
  }
}


//

// Get meals by area
// export async function getMealsByArea(area) {
//   try {
//     const response = await fetch(`${MEALDB_BASE}/filter.php?a=${area}`, {
//       next: { revalidate: 86400 }, // Cache for 24 hours
//     });

//     if (!response.ok) {
//       throw new Error("Failed to fetch meals");
//     }

//     const data = await response.json();
//     return {
//       success: true,
//       meals: data.meals || [],
//       area,
//     };
//   } catch (error) {
//     console.error("Error fetching meals by area:", error);
//     throw new Error(error.message || "Failed to load meals");
//   }
// }

export async function getMealsByArea(area) {
  const normalizedArea = normalizeCuisineName(area);

  if (!normalizedArea) {
    return {
      success: false,
      meals: [],
      area: "",
    };
  }

  // Load local recipes regardless of whether the API succeeds.
  const staticMeals = getStaticRecipesByArea(normalizedArea);

  let apiMeals = [];

  try {
    const response = await fetch(
      `${MEALDB_BASE}/filter.php?a=${encodeURIComponent(area)}`,
      {
        next: { revalidate: 86400 },
      }
    );

    if (response.ok) {
      const data = await response.json();
      apiMeals = data.meals || [];
    }
  } catch (error) {
    console.error("TheMealDB area request failed:", error);
  }

  // Combine both sources and remove duplicate IDs.
  const uniqueMeals = new Map();

  for (const meal of [...apiMeals, ...staticMeals]) {
    uniqueMeals.set(meal.idMeal, meal);
  }

  return {
    success: true,
    meals: [...uniqueMeals.values()],
    area,
  };
}