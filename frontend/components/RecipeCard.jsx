"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ChefHat,
  Clock3,
  CookingPot,
  Heart,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RecipeCard({ recipe, variant = "default" }) {
  if (!recipe) return null;

  const getRecipeData = () => {
    // TheMealDB recipes
    if (recipe.strMeal) {
      return {
        title: recipe.strMeal,
        image: recipe.strMealThumb,
        href: `/recipes/${recipe.idMeal}`,
        category: recipe.strCategory,
        cuisine: recipe.strArea,
        description: recipe.strInstructions,
        showImage: Boolean(recipe.strMealThumb),
        isMealDB: true,
      };
    }

    // AI-generated pantry recipes
    if (recipe.matchPercentage !== undefined) {
      return {
        title: recipe.title,
        image: recipe.imageUrl,
        href: `/recipe?cook=${encodeURIComponent(recipe.title)}`,
        description: recipe.description,
        category: recipe.category,
        cuisine: recipe.cuisine,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        matchPercentage: recipe.matchPercentage,
        missingIngredients: recipe.missingIngredients || [],
        showImage: Boolean(recipe.imageUrl),
      };
    }

    // Strapi recipes
    return {
      title: recipe.title,
      image: recipe.imageUrl,
      href: `/recipe?cook=${encodeURIComponent(recipe.title || "")}`,
      description: recipe.description,
      category: recipe.category,
      cuisine: recipe.cuisine,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      showImage: Boolean(recipe.imageUrl),
    };
  };

  const data = getRecipeData();

  if (!data.title || !data.href) return null;

  const totalTime =
    (Number.parseInt(data.prepTime, 10) || 0) +
    (Number.parseInt(data.cookTime, 10) || 0);

  const isGrid = variant === "grid";
  const isPantry = variant === "pantry";
  const isList = variant === "list";

  const imageSizes = isList
    ? "(max-width: 768px) 100vw, 220px"
    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  return (
    <Card
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-stone-200/80 bg-white p-0 shadow-[0_3px_16px_-8px_rgba(41,37,36,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_18px_40px_-18px_rgba(154,80,24,0.24)] ${
        isList ? "sm:flex-row" : ""
      }`}
    >
      {/* Food photography */}
      <Link
        href={data.href}
        aria-label={`View ${data.title} recipe`}
        className={`relative block shrink-0 overflow-hidden bg-[#F5EBDD] ${
          isList
            ? "aspect-[16/10] w-full sm:aspect-auto sm:w-56"
            : isGrid
              ? "aspect-[4/3] w-full"
              : "aspect-[16/10] w-full"
        }`}
      >
        {data.showImage ? (
          <Image
            src={data.image}
            alt={data.title}
            fill
            sizes={imageSizes}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-stone-100">
            <ChefHat className="h-16 w-16 text-orange-300" strokeWidth={1.1} />
          </div>
        )}

        {/* Image gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5 opacity-70" />

        {/* Category label */}
        {data.category && (
          <div className="absolute left-4 top-4">
            <Badge className="rounded-full border border-white/60 bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-800 shadow-sm hover:bg-white">
              {data.category}
            </Badge>
          </div>
        )}

        {/* Match score */}
        {data.matchPercentage !== undefined && (
          <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/95 px-3 py-1.5 text-xs font-bold text-orange-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {data.matchPercentage}% match
          </div>
        )}

        {/* View icon */}
        <div className="absolute bottom-4 right-4 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white text-stone-900 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-5 w-5" />
        </div>
      </Link>

      {/* Card content */}
      <div className="flex flex-1 flex-col">
        <CardHeader className="space-y-3 px-5 pb-3 pt-5 sm:px-5">
          {data.cuisine && (
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.13em] text-orange-700">
              <CookingPot className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{data.cuisine}</span>
            </div>
          )}

          <Link href={data.href} className="block">
            <CardTitle className="line-clamp-2 font-serif text-xl font-semibold leading-snug tracking-tight text-stone-900 transition-colors duration-200 group-hover:text-orange-700">
              {data.title}
            </CardTitle>
          </Link>

          {data.description && !data.isMealDB && (
            <CardDescription className="line-clamp-2 text-sm leading-6 text-stone-500">
              {data.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex-1 px-5 pb-4 pt-1">
          {/* Recipe information */}
          {(totalTime > 0 || data.servings) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-stone-500">
              {totalTime > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-orange-600" />
                  {totalTime} min
                </span>
              )}

              {data.servings && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-orange-600" />
                  {data.servings} servings
                </span>
              )}
            </div>
          )}

          {/* Pantry ingredients */}
          {isPantry && data.missingIngredients?.length > 0 && (
            <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/70 p-3.5">
              <p className="mb-2 text-xs font-semibold text-stone-800">
                Ingredients you&apos;ll need
              </p>

              <div className="flex flex-wrap gap-1.5">
                {data.missingIngredients.slice(0, 4).map((ingredient, index) => (
                  <Badge
                    key={`${ingredient}-${index}`}
                    variant="outline"
                    className="rounded-full border-orange-200 bg-white px-2.5 text-[11px] font-medium text-stone-600"
                  >
                    {ingredient}
                  </Badge>
                ))}

                {data.missingIngredients.length > 4 && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-orange-200 bg-white px-2.5 text-[11px] text-stone-600"
                  >
                    +{data.missingIngredients.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <CardFooter className="mt-auto border-t border-stone-100 px-5 py-4">
          <Link
            href={data.href}
            className="flex w-full items-center justify-between gap-3"
          >
            <span className="text-sm font-semibold text-stone-800 transition-colors group-hover:text-orange-700">
              {isPantry ? "View full recipe" : "Explore recipe"}
            </span>

            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition-all duration-300 group-hover:border-orange-600 group-hover:bg-orange-600 group-hover:text-white">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </CardFooter>
      </div>
    </Card>
  );
}