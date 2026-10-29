
import { Suspense } from "react";
import RecipeGrid from "@/components/RecipeGrid.jsx";
import RecipeGridSkeleton from "@/components/RecipeGridSkeleton.jsx";
import { getMealsByArea } from "@/actions/mealbd.action";

export default async function CuisineRecipesPage({ params }) {
  return (
    <Suspense fallback={<RecipeGridSkeleton count={8} />}>
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
