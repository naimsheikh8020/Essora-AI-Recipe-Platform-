"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChefHat,
  CookingPot,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import RecipeCard from "@/components/RecipeCard";
import useFetch from "@/hooks/use-fetch";
import { Skeleton } from "@/components/ui/skeleton";

function RecipeGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-label="Loading recipes"
      aria-busy="true"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none bg-stone-100" />

          <div className="space-y-4 p-5">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full bg-stone-100" />
              <Skeleton className="h-5 w-16 rounded-full bg-stone-100" />
            </div>

            <Skeleton className="h-6 w-4/5 bg-stone-100" />
            <Skeleton className="h-4 w-full bg-stone-100" />
            <Skeleton className="h-4 w-2/3 bg-stone-100" />

            <div className="flex items-center justify-between border-t border-stone-100 pt-4">
              <Skeleton className="h-4 w-24 bg-stone-100" />
              <Skeleton className="h-9 w-9 rounded-full bg-stone-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecipeGrid({
  type,
  value,
  fetchAction,
  backLink = "/dashboard",
}) {
  const { loading, data, fn: fetchMeals } = useFetch(fetchAction);

  useEffect(() => {
  if (!value) return;

  const formattedValue = value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  fetchMeals(formattedValue);
}, [value, fetchMeals]);

  const meals = data?.meals || [];

  const displayName = (value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const isCuisine = type === "cuisine";
  const heading = isCuisine ? "Cuisine" : "Recipes";

  return (
    <main className="min-h-screen bg-[#FAF9F6] pb-20 pt-12 text-stone-900">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {/* Back navigation */}
        <Link
          href={backLink}
          className="group mb-8 inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 px-4 py-2.5 text-sm font-medium text-stone-600 shadow-sm transition-all hover:border-orange-200 hover:text-orange-700"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to explore
        </Link>

        {/* Premium hero */}
        <section className="relative mb-12 overflow-hidden rounded-[2rem] border border-orange-100/80 bg-[#F5EBDD]">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />

          <div className="relative grid items-center gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1fr_auto] lg:px-16 lg:py-16">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/70 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-800">
                <Sparkles className="h-3.5 w-3.5" />
                Discover something delicious
              </div>

              <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-7xl">
                Explore the
                <br />
                <span className="font-serif italic font-medium text-orange-700">
                  {displayName || "Delicious"}
                </span>
                <span className="text-stone-800"> {heading}</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-stone-600 sm:text-lg">
                {isCuisine
                  ? `Discover authentic ${displayName} flavors, explore inspiring dishes, and find your next favorite meal.`
                  : `Find your next favorite ${displayName.toLowerCase()} recipe with inspiring dishes and delicious ideas for your table.`}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 px-4 py-3 text-sm font-medium text-stone-700 shadow-sm">
                  <CookingPot className="h-4 w-4 text-orange-700" />
                  Easy inspiration
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 px-4 py-3 text-sm font-medium text-stone-700 shadow-sm">
                  <UtensilsCrossed className="h-4 w-4 text-orange-700" />
                  Explore new flavors
                </div>
              </div>
            </div>

            {/* Decorative hero icon */}
            <div className="hidden lg:flex lg:justify-center">
              <div className="flex h-44 w-44 items-center justify-center rounded-full border border-white/80 bg-white/50 shadow-[0_20px_70px_-30px_rgba(154,80,24,0.3)]">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border border-orange-200/70 bg-[#FAF3E9]">
                  <ChefHat
                    className="h-16 w-16 text-orange-700"
                    strokeWidth={1.2}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results heading */}
        <section>
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                <span className="h-px w-6 bg-orange-600" />
                Made for your next meal
              </div>

              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {loading
                  ? "Finding delicious ideas..."
                  : meals.length > 0
                    ? "Recipes to fall in love with"
                    : "Explore your next favorite"}
              </h2>

              <p className="mt-2 text-sm text-stone-500 sm:text-base">
                {loading
                  ? "Preparing your collection of dishes."
                  : meals.length > 0
                    ? `${meals.length} ${isCuisine ? "dishes" : "recipes"} ready for you to discover`
                    : "We couldn't find any matching dishes right now."}
              </p>
            </div>

            {!loading && meals.length > 0 && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
                <UtensilsCrossed className="h-4 w-4 text-orange-600" />
                {displayName}
              </div>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && <RecipeGridSkeleton />}

          {/* Recipe collection */}
          {!loading && meals.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {meals.map((meal) => (
                <div
                  key={meal.idMeal}
                  className="min-w-0 transition-transform duration-300 hover:-translate-y-1"
                >
                  <RecipeCard recipe={meal} variant="grid" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && meals.length === 0 && (
            <div className="rounded-[2rem] border border-stone-200/80 bg-white px-6 py-16 text-center shadow-sm sm:py-20">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-orange-700">
                <CookingPot className="h-9 w-9" strokeWidth={1.5} />
              </div>

              <h3 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
                No recipes found just yet
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500 sm:text-base">
                We couldn&apos;t find any {displayName.toLowerCase()}{" "}
                {isCuisine ? "dishes" : "recipes"}. Try exploring another
                collection to discover something delicious.
              </p>

              <Link
                href={backLink}
                className="group mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-700 hover:shadow-md"
              >
                Explore more recipes
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </section>

        {/* Closing note */}
        {!loading && meals.length > 0 && (
          <div className="mt-14 flex flex-col items-center justify-between gap-4 rounded-2xl border border-stone-200/70 bg-white/70 px-6 py-6 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-semibold text-stone-800">
                Good food starts with inspiration.
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Pick a dish and discover how to make it.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
              <Sparkles className="h-4 w-4" />
              Your next favorite could be here
            </div>
          </div>
        )}
      </div>
    </main>
  );
}