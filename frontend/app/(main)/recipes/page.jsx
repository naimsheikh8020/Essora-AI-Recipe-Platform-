import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSavedRecipes } from "@/actions/recipe.actions";
import SavedRecipesClient from "@/components/SavedRecipesClient";

export default async function MyRecipesPage() {
  await connection();
  const result = await getSavedRecipes(1, 12);

  if (result?.code === "UNAUTHENTICATED") {
    redirect("/sign-in?redirect_url=%2Frecipes");
  }

  if (!result?.success) {
    return <SavedRecipesClient initialResult={result} />;
  }

  return <SavedRecipesClient initialResult={result} />;
}
