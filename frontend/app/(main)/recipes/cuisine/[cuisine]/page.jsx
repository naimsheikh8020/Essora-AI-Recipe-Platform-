
import { Suspense } from "react";
import RecipeGrid from "@/components/RecipeGrid.jsx";
import { getMealsByArea } from "@/actions/mealbd.action";

export default function CuisineRecipesPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="p-6" role="status">
          Loading recipes...
        </div>
      }
    >
      <CuisineRecipesContent params={params} />
    </Suspense>
  );
}

async function CuisineRecipesContent({ params }) {
  const { cuisine } = await params;

  const normalizedCuisine =
    cuisine.charAt(0).toUpperCase() + cuisine.slice(1);

  return (
    <RecipeGrid
      type="cuisine"
      value={normalizedCuisine}
      fetchAction={getMealsByArea}
      backLink="/dashboard"
    />
  );
}
