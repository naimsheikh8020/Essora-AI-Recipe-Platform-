/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChefHat,
  Lightbulb,
  Bookmark,
  BookmarkCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/use-fetch";
import {
  getOrGenerateRecipe,
  saveRecipeToCollection,
  removeRecipeFromCollection,
} from "@/actions/recipe.actions";
import { toast } from "sonner";
import Image from "next/image";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { RecipePDF } from "@/components/RecipePDF";
import { ClockLoader } from "react-spinners";
import ProLockedSection from "@/components/ProLockedSection";

function RecipeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const recipeName = searchParams.get("cook");
  const pantryFingerprint = searchParams.get("pantryFingerprint");

  const [recipe, setRecipe] = useState(null);
  const [recipeId, setRecipeId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [preparedIngredients, setPreparedIngredients] = useState([]);
  const requestedRecipeKey = useRef(null);

  // Get or generate recipe
  const {
    loading: loadingRecipe,
    data: recipeData,
    fn: fetchRecipe,
  } = useFetch(getOrGenerateRecipe);

  // Save to collection
  const {
    loading: saving,
    data: saveData,
    fn: saveToCollection,
  } = useFetch(saveRecipeToCollection);

  // Remove from collection
  const {
    loading: removing,
    data: removeData,
    fn: removeFromCollection,
  } = useFetch(removeRecipeFromCollection);

  // Fetch recipe on mount
  useEffect(() => {
    if (!recipeName) return;

    const requestKey = `${recipeName}:${pantryFingerprint || "saved"}`;
    if (requestedRecipeKey.current === requestKey) return;

    requestedRecipeKey.current = requestKey;
    setRecipe(null);
    setRecipeId(null);
    setIsSaved(false);
    setPreparedIngredients([]);

    const formData = new FormData();
    formData.append("recipeName", recipeName);
    if (pantryFingerprint) {
      formData.append("pantryFingerprint", pantryFingerprint);
    }
    fetchRecipe(formData);
  }, [recipeName, pantryFingerprint, fetchRecipe]);

  // Update recipe when data arrives
  useEffect(() => {
    if (recipeData?.success) {
      setRecipe(recipeData.recipe);
      setRecipeId(recipeData.recipeId);
      setIsSaved(recipeData.isSaved);

      if (recipeData.fromDatabase) {
        toast.success("Recipe loaded from database");
      } else {
        toast.success("New recipe generated and saved!");
      }
    }
  }, [recipeData]);

  // Handle save success
  useEffect(() => {
    if (saveData?.success) {
      if (saveData.alreadySaved) {
        toast.info("Recipe is already in your collection");
      } else {
        setIsSaved(true);
        toast.success("Recipe saved to your collection!");
      }
    }
  }, [saveData]);

  // Handle remove success
  useEffect(() => {
    if (removeData?.success) {
      setIsSaved(false);
      toast.success("Recipe removed from collection");
    }
  }, [removeData]);

  // Toggle save/unsave
  const handleToggleSave = async () => {
    if (!recipeId) return;

    const formData = new FormData();
    formData.append("recipeId", recipeId);

    if (isSaved) {
      await removeFromCollection(formData);
    } else {
      await saveToCollection(formData);
    }
  };

  // No recipe name in URL
  if (!recipeName) {
    return (
      <div className="min-h-screen bg-stone-50 pt-12 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center py-20">
          <div className="bg-orange-50 w-20 h-20 border-2 border-orange-200 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            No recipe specified
          </h2>
          <p className="text-stone-600 mb-6 font-light">
            Please select a recipe from the dashboard
          </p>
          <Link href="/dashboard">
            <Button className="bg-orange-600 hover:bg-orange-700">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loadingRecipe === null || loadingRecipe) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-20">
            <ClockLoader className="mx-auto mb-6" color="#dc6300" />
            <h2 className="text-3xl font-bold text-stone-900 mb-2 tracking-tight">
              Preparing Your Recipe
            </h2>
            <p className="text-stone-600 font-light">
              Our AI chef is crafting detailed instructions for{" "}
              <span className="font-bold text-orange-600">{recipeName}</span>
              ...
            </p>
            <div className="mt-8 max-w-md mx-auto">
              <div className="flex items-center gap-3 text-sm text-stone-500">
                <div className="flex-1 h-1 bg-stone-200 overflow-hidden relative">
                  <div className="absolute left-0 top-0 h-full bg-orange-600 animate-slow-fill" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadingRecipe === false && !recipe) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center py-20">
          <div className="bg-red-50 w-20 h-20 border-2 border-red-200 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            Failed to load recipe
          </h2>
          <p className="text-stone-600 mb-6 font-light">
            Something went wrong while loading the recipe. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="border-2 border-stone-900 hover:bg-stone-900 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const groupedIngredients = Object.entries(
    (Array.isArray(recipe.ingredients) ? recipe.ingredients : []).reduce(
      (groups, ingredient) => {
        const category = ingredient.category || "Other";
        groups[category] = groups[category] || [];
        groups[category].push(ingredient);
        return groups;
      },
      {}
    )
  );
  const totalTime =
    (Number.parseInt(recipe.prepTime, 10) || 0) +
    (Number.parseInt(recipe.cookTime, 10) || 0);

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-20 pt-10 text-stone-900 sm:pt-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-orange-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-stone-200/70">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[300px] bg-stone-100 sm:min-h-[440px]">
              {recipe.imageUrl ? (
                <Image
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center bg-orange-50 text-orange-300">
                  <ChefHat className="h-20 w-20" strokeWidth={1} />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
              <div className="mb-5 flex flex-wrap gap-2">
                {recipe.cuisine && (
                  <Badge className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-50">
                    {recipe.cuisine}
                  </Badge>
                )}
                {recipe.category && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 capitalize"
                  >
                    {recipe.category}
                  </Badge>
                )}
              </div>

              <h1 className="max-w-xl font-serif text-4xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-5xl lg:text-6xl">
                {recipe.title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-stone-600 sm:text-lg">
                {recipe.description}
              </p>

              <div className="mt-7 grid grid-cols-3 gap-3 border-y border-stone-200 py-5 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Prep
                  </p>
                  <p className="mt-1 font-semibold text-stone-900">
                    {recipe.prepTime} min
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Cook
                  </p>
                  <p className="mt-1 font-semibold text-stone-900">
                    {recipe.cookTime} min
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Serves
                  </p>
                  <p className="mt-1 font-semibold text-stone-900">
                    {recipe.servings}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  onClick={handleToggleSave}
                  disabled={saving || removing}
                  className={
                    isSaved
                      ? "rounded-xl bg-emerald-600 px-5 text-white hover:bg-emerald-700"
                      : "rounded-xl bg-orange-600 px-5 text-white hover:bg-orange-700"
                  }
                >
                  {saving || removing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : removing ? "Removing..." : isSaved ? "Saved" : "Save recipe"}
                </Button>
                <PDFDownloadLink
                  document={<RecipePDF recipe={recipe} />}
                  fileName={`${recipe.title.replace(/\s+/g, "-").toLowerCase()}.pdf`}
                >
                  {({ loading }) => (
                    <Button
                      variant="outline"
                      disabled={loading}
                      className="rounded-xl border-stone-300 bg-white px-5 text-stone-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                    >
                      <Download className="h-4 w-4" />
                      {loading ? "Preparing PDF..." : "Download PDF"}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(260px,0.82fr)_minmax(0,1.35fr)]">
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                    Mise en place
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Ingredients
                  </h2>
                </div>
                <ChefHat className="h-6 w-6 text-orange-600" />
              </div>

              <div className="space-y-6">
                {groupedIngredients.map(([category, items]) => (
                  <div key={category}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                      {category}
                    </h3>
                    <div className="divide-y divide-stone-100">
                      {items.map((ingredient, index) => {
                        const ingredientKey = `${category}-${ingredient.item}-${index}`;
                        const isPrepared = preparedIngredients.includes(ingredientKey);
                        return (
                          <label
                            key={ingredientKey}
                            className="flex cursor-pointer items-start gap-3 py-3 first:pt-1"
                          >
                            <input
                              type="checkbox"
                              checked={isPrepared}
                              onChange={() =>
                                setPreparedIngredients((current) =>
                                  isPrepared
                                    ? current.filter((key) => key !== ingredientKey)
                                    : [...current, ingredientKey]
                                )
                              }
                              className="mt-1 h-4 w-4 rounded border-stone-300 accent-orange-600"
                            />
                            <span className={`flex-1 text-sm leading-6 ${isPrepared ? "text-stone-400 line-through" : "text-stone-700"}`}>
                              {ingredient.item}
                            </span>
                            <span className="text-right text-sm font-semibold text-stone-900">
                              {ingredient.amount}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {recipe.nutrition && (
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Nutrition</h2>
                  {!recipeData.isPro && (
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Pro
                    </span>
                  )}
                </div>
                <ProLockedSection
                  isPro={recipeData.isPro}
                  lockText="Nutrition info is Pro-only"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Calories", recipe.nutrition.calories],
                      ["Protein", recipe.nutrition.protein],
                      ["Carbs", recipe.nutrition.carbs],
                      ["Fat", recipe.nutrition.fat],
                    ].map(([label, value], index) => (
                      <div key={label} className="rounded-xl bg-stone-50 p-3">
                        <p className={`text-xl font-semibold ${index === 0 ? "text-orange-600" : "text-stone-900"}`}>
                          {value}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </ProLockedSection>
              </section>
            )}
          </aside>

          <div className="space-y-8">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70 sm:p-8">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                  The method
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                  Cooking instructions
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  {totalTime} minutes from start to finish.
                </p>
              </div>

              <div className="space-y-8">
                {recipe.instructions.map((step, index) => (
                  <div key={step.step || index} className="relative flex gap-5">
                    <div className="relative flex w-9 shrink-0 justify-center">
                      <span className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
                        {step.step || index + 1}
                      </span>
                      {index !== recipe.instructions.length - 1 && (
                        <span className="absolute top-9 h-[calc(100%+2rem)] w-px bg-orange-100" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <h3 className="text-lg font-semibold text-stone-900">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-stone-600">
                        {step.instruction}
                      </p>
                      {step.tip && (
                        <div className="mt-4 rounded-xl bg-orange-50/70 px-4 py-3 text-sm leading-6 text-orange-950">
                          <span className="mr-1 font-semibold text-orange-700">Tip</span>
                          {step.tip}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-2xl bg-stone-900 p-6 text-white sm:p-8">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-orange-400" />
                <div>
                  <h3 className="font-semibold">Ready to serve</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-300">
                    Plate your masterpiece and enjoy your {recipe.title}.
                  </p>
                </div>
              </div>
            </div>

            {recipe.tips?.length > 0 && (
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70 sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-orange-600" />
                  <h2 className="text-2xl font-semibold">Chef&apos;s tips</h2>
                  {!recipeData.isPro && (
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Pro
                    </span>
                  )}
                </div>
                <ProLockedSection
                  isPro={recipeData.isPro}
                  lockText="Chef tips are Pro-only"
                  ctaText="Unlock Pro Tips →"
                >
                  <ul className="space-y-3">
                    {recipe.tips.map((tip, index) => (
                      <li key={index} className="flex gap-3 text-sm leading-7 text-stone-600">
                        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-600" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </ProLockedSection>
              </section>
            )}

            {recipe.substitutions?.length > 0 && (
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70 sm:p-8">
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-2xl font-semibold">Substitutions</h2>
                  {!recipeData.isPro && (
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Pro
                    </span>
                  )}
                </div>
                <p className="mb-6 text-sm leading-6 text-stone-500">
                  Flexible alternatives when you&apos;re missing an ingredient.
                </p>
                <ProLockedSection
                  isPro={recipeData.isPro}
                  lockText="Substitutions are Pro-only"
                >
                  <div className="divide-y divide-stone-100">
                    {recipe.substitutions.map((sub, index) => (
                      <div key={index} className="py-4 first:pt-0 last:pb-0">
                        <p className="text-sm font-semibold text-stone-900">
                          Instead of <span className="text-orange-600">{sub.original}</span>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sub.alternatives.map((alternative, alternativeIndex) => (
                            <Badge
                              key={alternativeIndex}
                              variant="outline"
                              className="rounded-full border-stone-200 px-3 py-1 text-xs font-medium text-stone-600"
                            >
                              {alternative}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ProLockedSection>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RecipePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center py-20">
            <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-6" />
            <p className="text-stone-600">Loading recipe...</p>
          </div>
        </div>
      }
    >
      <RecipeContent />
    </Suspense>
  );
}