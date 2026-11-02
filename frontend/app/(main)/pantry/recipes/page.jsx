
"use client";

import {
  useEffect,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertCircle,
  Package,
  RefreshCw,
  ArrowRight,
  Crown,
  Plus,
} from "lucide-react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/use-fetch";
import {
  getPantryIngredients,
  getRecipesByPantryIngredients,
} from "@/actions/recipe.actions";
import RecipeCard from "@/components/RecipeCard";
import PricingModal from "@/components/PricingModal";

// ==================================================
// CACHE CONFIGURATION
// ==================================================

const CACHE_KEY = "essora-pantry-recipes";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const CACHE_EVENT = "essora-pantry-recipes-updated";
const PANTRY_EVENT = "essora-pantry-updated";
const inFlightRecipesRequests = new Map();
let refreshRequestId = 0;

// ==================================================
// CACHE FUNCTIONS
// ==================================================

function parseCacheStore(value) {
  if (!value) return { entries: {} };

  try {
    const parsed = JSON.parse(value);

    return parsed && typeof parsed.entries === "object"
      ? parsed
      : { entries: {} };
  } catch {
    return { entries: {} };
  }
}

function parseCachedRecipes(value, fingerprint) {
  const entry = parseCacheStore(value).entries?.[fingerprint];

  if (
    !entry ||
    !Array.isArray(entry.data?.recipes) ||
    entry.data.recipes.length === 0 ||
    typeof entry.savedAt !== "number" ||
    Date.now() - entry.savedAt >= CACHE_TTL
  ) {
    return null;
  }

  return entry.data;
}

function getCacheKey(userId) {
  return userId ? `${CACHE_KEY}:${userId}` : null;
}

function getCachedRecipes(userId, fingerprint) {
  const cacheKey = getCacheKey(userId);

  if (typeof window === "undefined" || !cacheKey || !fingerprint) return null;

  try {
    return parseCachedRecipes(sessionStorage.getItem(cacheKey), fingerprint);
  } catch (error) {
    console.error("Failed to read recipe cache:", error);
    return null;
  }
}

function saveCachedRecipes(userId, fingerprint, data) {
  const cacheKey = getCacheKey(userId);

  if (
    typeof window === "undefined" ||
    !cacheKey ||
    !fingerprint ||
    !data?.recipes?.length
  ) {
    return;
  }

  try {
    const cache = parseCacheStore(sessionStorage.getItem(cacheKey));

    cache.entries[fingerprint] = {
      data,
      savedAt: Date.now(),
    };

    sessionStorage.setItem(
      cacheKey,
      JSON.stringify(cache)
    );

    window.dispatchEvent(new Event(CACHE_EVENT));
  } catch (error) {
    console.error("Failed to save recipe cache:", error);
  }
}

// ==================================================
// EXTERNAL STORE FOR SESSION STORAGE
// ==================================================

function subscribeToCache(callback) {
  if (typeof window === "undefined") {
    return () => { };
  }

  window.addEventListener(CACHE_EVENT, callback);
  window.addEventListener(PANTRY_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CACHE_EVENT, callback);
    window.removeEventListener(PANTRY_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getCacheSnapshot(cacheKey) {
  if (typeof window === "undefined" || !cacheKey) return null;

  return sessionStorage.getItem(cacheKey);
}

function getServerSnapshot() {
  return null;
}

async function fetchPantryRecipesOnce(userId, fingerprint, force = false) {
  const requestKey = force
    ? `${userId}:${fingerprint}:refresh:${++refreshRequestId}`
    : `${userId}:${fingerprint}`;

  if (!inFlightRecipesRequests.has(requestKey)) {
    inFlightRecipesRequests.set(
      requestKey,
      getRecipesByPantryIngredients(fingerprint)
    );
  }

  const request = inFlightRecipesRequests.get(requestKey);

  try {
    return await request;
  } finally {
    if (inFlightRecipesRequests.get(requestKey) === request) {
      inFlightRecipesRequests.delete(requestKey);
    }
  }
}

// ==================================================
// MAIN COMPONENT
// ==================================================

export default function PantryRecipesPage() {
  const [progress, setProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const initialLoadStarted = useRef(false);
  const generationStartedForFingerprint = useRef(null);

  const {
    loading,
    data: fetchedRecipesData,
    error,
    fn: fetchSuggestions,
  } = useFetch(fetchPantryRecipesOnce);

  const {
    loading: pantryLoading,
    data: pantryData,
    error: pantryError,
    fn: fetchPantry,
  } = useFetch(getPantryIngredients);

  const currentUserId = pantryData?.userId;
  const currentFingerprint = pantryData?.fingerprint;
  const isLoading = loading || pantryLoading;
  const cacheKey = getCacheKey(currentUserId);
  const getCurrentCacheSnapshot = useCallback(
    () => getCacheSnapshot(cacheKey),
    [cacheKey]
  );
  // Subscribe to sessionStorage changes without restoring state in an effect.
  const cacheSnapshot = useSyncExternalStore(
    subscribeToCache,
    getCurrentCacheSnapshot,
    getServerSnapshot
  );
  const cachedRecipesData = parseCachedRecipes(
    cacheSnapshot,
    currentFingerprint
  );

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    if (initialLoadStarted.current) return;

    initialLoadStarted.current = true;

    fetchPantry();
  }, [fetchPantry]);

  useEffect(() => {
    const handlePantryChange = () => {
      fetchPantry();
    };

    window.addEventListener(PANTRY_EVENT, handlePantryChange);
    window.addEventListener("storage", handlePantryChange);

    return () => {
      window.removeEventListener(PANTRY_EVENT, handlePantryChange);
      window.removeEventListener("storage", handlePantryChange);
    };
  }, [fetchPantry]);

  useEffect(() => {
    if (
      !currentUserId ||
      !currentFingerprint ||
      generationStartedForFingerprint.current ===
      `${currentUserId}:${currentFingerprint}`
    ) {
      return;
    }

    generationStartedForFingerprint.current = `${currentUserId}:${currentFingerprint}`;

    if (getCachedRecipes(currentUserId, currentFingerprint)) {
      return;
    }

    fetchSuggestions(currentUserId, currentFingerprint).then((response) => {
      if (response?.stale) {
        fetchPantry();
      }
    });
  }, [
    currentUserId,
    currentFingerprint,
    fetchSuggestions,
    fetchPantry,
  ]);

  // ==================================================
  // SAVE GENERATED RECIPES
  // ==================================================

  useEffect(() => {
    if (loading || !fetchedRecipesData?.recipes?.length) {
      return;
    }

    if (
      fetchedRecipesData.userId !== currentUserId ||
      fetchedRecipesData.fingerprint !== currentFingerprint
    ) {
      return;
    }

    saveCachedRecipes(
      currentUserId,
      fetchedRecipesData.fingerprint,
      fetchedRecipesData
    );
  }, [loading, fetchedRecipesData, currentUserId, currentFingerprint]);

  // ==================================================
  // GENERATION PROGRESS
  // ==================================================

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) return 90;

        if (current < 30) return Math.min(current + 5, 90);
        if (current < 60) return Math.min(current + 3, 90);
        if (current < 80) return Math.min(current + 2, 90);

        return Math.min(current + 1, 90);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [loading]);

  // ==================================================
  // SELECT RECIPE DATA
  // ==================================================

  const recipesData =
    !isRefreshing &&
      fetchedRecipesData?.userId === currentUserId &&
      fetchedRecipesData?.fingerprint === currentFingerprint
      ? fetchedRecipesData
      : !isRefreshing
        ? cachedRecipesData
        : null;

  const recipes = recipesData?.recipes || [];
  const ingredientsUsed = recipesData?.ingredientsUsed || "";

  // ==================================================
  // REFRESH RECIPES
  // ==================================================

  const handleRefresh = async () => {
    const latestPantry = await fetchPantry();

    if (
      !latestPantry?.success ||
      !latestPantry.userId ||
      !latestPantry.fingerprint
    ) {
      return;
    }

    setProgress(0);
    setIsRefreshing(true);

    try {
      await fetchSuggestions(
        latestPantry.userId,
        latestPantry.fingerprint,
        true
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // ==================================================
  // ERROR HANDLING
  // ==================================================

  const isMonthlyLimitReached = error?.message
    ?.toLowerCase()
    .includes("monthly ai recipe limit reached");

  const hasOtherError = Boolean(error || pantryError) && !isMonthlyLimitReached;

  const pantryIngredients = Array.isArray(ingredientsUsed)
    ? ingredientsUsed
    : typeof ingredientsUsed === "string"
      ? ingredientsUsed.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

  // ==================================================
  // UI
  // ==================================================

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 pb-20 pt-12 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/pantry"
            className="group mb-8 inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 px-4 py-2.5 text-sm font-medium text-stone-600 shadow-sm transition-all hover:border-orange-200 hover:text-orange-700"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Pantry
          </Link>
        </div>

        {/* Ingredients Section */}
        {pantryIngredients.length > 0 && (
          <section className="mb-10 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">

            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-stone-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-stone-900">
                      Your pantry ingredients
                    </h2>

                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                      {pantryIngredients.length} items
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-stone-500">
                    Ingredients used to discover your recipes.
                  </p>
                </div>
              </div>

              <Link
                href="/pantry"
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              >
                Manage pantry
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Ingredient chips */}
            <div className="px-5 py-5 sm:px-6">
              <div className="flex flex-wrap gap-2">
                {pantryIngredients.map((ingredient, index) => (
                  <span
                    key={`${ingredient}-${index}`}
                    className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>

          </section>
        )}

        {/* Recipe Section Heading */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-orange-600">
              <Sparkles className="h-4 w-4" />
              Discover something delicious
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Recipe suggestions
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              Meals selected based on what you already have.
            </p>
          </div>

          {!isLoading && recipes.length > 0 && (
            <Badge
              variant="outline"
              className="w-fit rounded-full border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600"
            >
              {recipes.length}{" "}
              {recipes.length === 1 ? "recipe found" : "recipes found"}
            </Badge>
          )}

        </div>

        {/* Loading State */}
        {isLoading && (
          <section className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>

            <h3 className="text-xl font-bold text-stone-900">
              Your AI chef is at work
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
              {progress < 30
                ? "Analyzing your pantry ingredients..."
                : progress < 60
                  ? "Discovering delicious recipe combinations..."
                  : progress < 90
                    ? "Preparing your personalized recipes..."
                    : "Almost ready! Finalizing your suggestions..."}
            </p>

            <div className="mx-auto mt-8 max-w-md">

              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500">
                  Generating recipes
                </span>

                <span className="text-sm font-bold tabular-nums text-orange-600">
                  {progress}%
                </span>
              </div>

              <div
                className="h-2 w-full overflow-hidden rounded-full bg-stone-100"
                role="progressbar"
                aria-label="Recipe generation progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-stone-400">
                This may take a few seconds.
              </p>

            </div>
          </section>
        )}

        {/* Monthly Limit Reached */}
        {!isLoading && isMonthlyLimitReached && (
          <section className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">

            <div className="bg-orange-50 px-6 py-10 text-center sm:px-12">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Crown className="h-8 w-8 text-orange-600" />
              </div>

              <Badge className="mb-4 border-0 bg-orange-100 text-orange-700 hover:bg-orange-100">
                FREE PLAN LIMIT
              </Badge>

              <h3 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                You&apos;ve reached your monthly limit
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-600">
                You&apos;ve used all your free AI recipe recommendations. Upgrade
                to Pro and discover unlimited ways to cook with your pantry.
              </p>

              <div className="mt-7 flex justify-center">
                <PricingModal>
                  <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700">
                    <Sparkles className="h-4 w-4" />
                    Explore Pro Plan
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </PricingModal>
              </div>

            </div>
          </section>
        )}

        {/* General API Error */}
        {!isLoading && hasOtherError && (
          <section className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm">

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>

            <h3 className="text-xl font-bold text-stone-900">
              We couldn&apos;t find your recipes
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
              Something went wrong while generating your recipe suggestions.
              Please try again.
            </p>

            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              className="mt-6 gap-2 rounded-xl bg-stone-900 px-6 text-white hover:bg-orange-600"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

          </section>
        )}

        {/* Empty Pantry State */}
        {!isLoading && !error && !pantryError && recipesData?.success === false && (
          <section className="rounded-2xl border border-stone-200 bg-white px-6 py-14 text-center shadow-sm">

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
              <Package className="h-8 w-8 text-orange-600" />
            </div>

            <h3 className="text-2xl font-bold text-stone-900">
              Your pantry is waiting
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-500">
              Add some ingredients to your pantry and we&apos;ll help you discover
              delicious meals you can prepare.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

              <Link href="/pantry">
                <Button className="w-full gap-2 rounded-xl bg-orange-600 px-6 text-white hover:bg-orange-700 sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add Ingredients
                </Button>
              </Link>

              <Link href="/pantry/scan">
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-xl border-stone-300 sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  Scan with AI
                </Button>
              </Link>

            </div>
          </section>
        )}

        {/* Recipe Results */}
        {!isLoading && !error && !pantryError && recipes.length > 0 && (
          <section>

            <div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              onClickCapture={() => {
                // Save recipes BEFORE the detail-page navigation.
                saveCachedRecipes(
                  currentUserId,
                  currentFingerprint,
                  recipesData
                );
              }}
            >
              {recipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id || recipe.title || index}
                  recipe={recipe}
                  pantryFingerprint={currentFingerprint}
                  variant="pantry"
                />
              ))}
            </div>

            {/* Refresh Suggestions */}
            <div className="mt-10 flex flex-col items-center">

              <p className="mb-4 text-sm text-stone-500">
                Want to discover something different?
              </p>

              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                className="gap-2 rounded-xl border-stone-300 bg-white px-6 py-5 font-semibold text-stone-800 transition hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700"
              >
                <RefreshCw className="h-4 w-4" />
                Get New Suggestions
              </Button>

            </div>
          </section>
        )}

        {/* Footer */}
        <div className="mt-16 border-t border-stone-200 pt-6 text-center">
          <p className="text-xs text-stone-400">
            Made with <span className="text-orange-500">♥</span> by Essora AI
          </p>
        </div>

      </div>
    </main>
  );
}
