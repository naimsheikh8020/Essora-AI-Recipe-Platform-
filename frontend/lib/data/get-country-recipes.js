
import { bangladeshRecipes } from "@/lib/data/bangladesh-recipes";

export async function getCountryRecipes(country) {
  const staticRecipes =
    country.toLowerCase() === "bangladesh"
      ? bangladeshRecipes
      : [];

  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(country)}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recipes from TheMealDB");
    }

    const data = await response.json();
    const apiRecipes = data.meals ?? [];

    // Avoid showing the same recipe twice.
    const apiRecipeNames = new Set(
      apiRecipes.map((recipe) => recipe.strMeal.toLowerCase().trim())
    );

    const uniqueStaticRecipes = staticRecipes.filter(
      (recipe) =>
        !apiRecipeNames.has(recipe.strMeal.toLowerCase().trim())
    );

    // Return API recipes and your own static recipes together.
    return [...apiRecipes, ...uniqueStaticRecipes];
  } catch (error) {
    console.error("TheMealDB request failed:", error);

    // Keep static recipes available even when the API fails.
    return staticRecipes;
  }
}
