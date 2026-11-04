"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  CookingPot,
  Heart,
  Loader2,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getSavedRecipes,
  removeRecipeFromCollection,
} from "@/actions/recipe.actions";

function descriptionText(description) {
  if (typeof description === "string") return description;
  if (!Array.isArray(description)) return "";
  return description
    .flatMap((block) => block?.children || [])
    .map((child) => child?.text || "")
    .join(" ")
    .trim();
}

function RecipeSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
      <div className="h-52 animate-pulse bg-stone-200" />
      <div className="space-y-3 p-5">
        <div className="h-5 animate-pulse rounded bg-stone-200" />
        <div className="h-4 animate-pulse rounded bg-stone-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
      </div>
    </div>
  );
}

export default function SavedRecipesClient({ initialResult }) {
  const [recipes, setRecipes] = useState(initialResult?.recipes || []);
  const [pagination, setPagination] = useState(initialResult?.pagination || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    initialResult?.success === false ? initialResult.message : null
  );
  const [removingId, setRemovingId] = useState(null);

  const loadPage = async (page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSavedRecipes(page, pagination.pageSize || 12);
      if (!result?.success) {
        throw new Error(result?.message || "Unable to load saved recipes.");
      }
      setRecipes(result.recipes);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(loadError.message || "Unable to load saved recipes.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (recipe) => {
    if (removingId) return;
    setRemovingId(recipe.documentId);

    try {
      const formData = new FormData();
      formData.append("recipeDocumentId", recipe.documentId);
      const result = await removeRecipeFromCollection(formData);
      if (!result?.success) {
        throw new Error(result?.message || "Unable to remove recipe.");
      }
      setRecipes((current) =>
        current.filter((item) => item.documentId !== recipe.documentId)
      );
      toast.success("Recipe removed from your collection");
    } catch (removeError) {
      toast.error(removeError.message || "Unable to remove recipe.");
    } finally {
      setRemovingId(null);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen bg-[#faf9f6] px-4 pb-20 pt-28">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-stone-200">
          <h1 className="text-2xl font-semibold text-stone-900">
            We couldn&apos;t load your recipes
          </h1>
          <p className="mt-3 text-stone-600">{error}</p>
          <Button
            onClick={() => loadPage(1)}
            className="mt-6 bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 pb-20 pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
              Your collection
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950">
              My Recipes
            </h1>
            <p className="mt-3 max-w-xl text-stone-600">
              Your saved recipes, ready whenever you are.
            </p>
          </div>
          <Link
            href="/pantry"
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            Explore recipes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <RecipeSkeleton key={index} />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white px-6 py-20 text-center ring-1 ring-stone-200">
            <Heart className="mx-auto h-12 w-12 text-orange-300" />
            <h2 className="mt-5 text-2xl font-semibold text-stone-900">
              Your collection is empty
            </h2>
            <p className="mx-auto mt-3 max-w-md text-stone-600">
              Save recipes you love and they&apos;ll appear here for easy
              access.
            </p>
            <Link href="/pantry">
              <Button className="mt-6 bg-orange-600 hover:bg-orange-700">
                Find a recipe
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recipes.map((recipe) => {
                const totalTime =
                  (Number(recipe.prepTime) || 0) +
                  (Number(recipe.cookTime) || 0);
                const isRemoving = removingId === recipe.documentId;
                return (
                  <article
                    key={recipe.documentId}
                    className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <Link
                      href={`/recipe?recipeDocumentId=${encodeURIComponent(
                        recipe.documentId
                      )}`}
                      className="block"
                    >
                      <div className="relative h-52 overflow-hidden bg-orange-50">
                        {recipe.imageUrl ? (
                          <Image
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <CookingPot className="absolute inset-0 m-auto h-14 w-14 text-orange-300" />
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="line-clamp-2 text-xl font-semibold text-stone-900">
                            {recipe.title}
                          </h2>
                          {recipe.cuisine && (
                            <span className="shrink-0 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-700">
                              {recipe.cuisine}
                            </span>
                          )}
                        </div>
                        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-stone-600">
                          {descriptionText(recipe.description) ||
                            "A recipe saved to your collection."}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3 text-xs text-stone-500">
                          {totalTime > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5 text-orange-600" />
                              {totalTime} min
                            </span>
                          )}
                          {recipe.servings && (
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-orange-600" />
                              {recipe.servings} servings
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3">
                      <span className="text-xs text-stone-400">
                        {recipe.savedAt
                          ? `Saved ${new Date(recipe.savedAt).toLocaleDateString()}`
                          : "Saved recipe"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(recipe)}
                        disabled={isRemoving}
                        className="rounded-full p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Remove ${recipe.title}`}
                      >
                        {isRemoving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {pagination.pageCount > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  disabled={loading || pagination.page <= 1}
                  onClick={() => loadPage(pagination.page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-stone-500">
                  Page {pagination.page} of {pagination.pageCount}
                </span>
                <Button
                  variant="outline"
                  disabled={
                    loading || pagination.page >= pagination.pageCount
                  }
                  onClick={() => loadPage(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
