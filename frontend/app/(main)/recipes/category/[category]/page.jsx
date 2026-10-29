
import { Suspense } from "react";
import { notFound } from "next/navigation";
import RecipeGrid from "@/components/RecipeGrid";
import CategoryRecipesSkeleton from "@/components/CategoryRecipesSkeleton";
import { getMealsByCategory } from "@/actions/mealbd.action";

function CategoryRecipesContent({ category }) {
  if (!category) {
    notFound();
  }

  const normalizedCategory =
    category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <RecipeGrid
      type="category"
      value={normalizedCategory}
      fetchAction={getMealsByCategory}
      backLink="/dashboard"
    />
  );
}

export default async function CategoryRecipesPage({ params }) {
  return (
    <Suspense fallback={<CategoryRecipesSkeleton />}>
      <CategoryRecipesWrapper params={params} />
    </Suspense>
  );
}

async function CategoryRecipesWrapper({ params }) {
  const { category } = await params;

  return (
    <CategoryRecipesContent
      category={decodeURIComponent(category)}
    />
  );
}
