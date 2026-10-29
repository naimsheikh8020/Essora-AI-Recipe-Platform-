
import { bangladeshRecipes } from "./bangladesh-recipes";
import { afghanRecipes } from "./afghan";
import { finlandRecipes } from "./finland";

const cuisineRecipes = {
  bangladesh: bangladeshRecipes,
  bangladeshi: bangladeshRecipes,
  afghan: afghanRecipes,
  afghanistan: afghanRecipes,
  finland: finlandRecipes,
  finnish: finlandRecipes,
};

export function normalizeCuisineName(area) {
  return String(area || "")
    .trim()
    .replace(/-/g, " ")
    .toLowerCase();
}

export function getStaticRecipesByArea(area) {
  const cuisine = normalizeCuisineName(area);

  return cuisineRecipes[cuisine] || [];
}

export function getStaticRecipeById(id) {
  for (const recipes of Object.values(cuisineRecipes)) {
    const recipe = recipes.find(
      (meal) => String(meal.idMeal) === String(id)
    );

    if (recipe) {
      return recipe;
    }
  }

  return null;
}
