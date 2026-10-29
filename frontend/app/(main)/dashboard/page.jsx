
import React from "react";
import { getCountrySlug } from "@/lib/data/country-name-map";
import {
  Globe,
  ArrowRight,
  Flame,
  Clock3,
  ChefHat,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCategoryEmoji, getCountryFlag } from "@/lib/data";
import {
  getAreas,
  getCategories,
  getRecipeOfTheDay,

} from "@/actions/mealbd.action";
import Link from "next/link";

export default async function DashboardPage() {
  // Fetch data server-side
  const [recipeData, categoriesData, areasData] = await Promise.all([
    getRecipeOfTheDay(),
    getCategories(),
    getAreas(),
  ]);

  const recipeOfTheDay = recipeData?.recipe;
  const categories = categoriesData?.categories || [];


  const staticAreas = [
    {
      strArea: "Bangladesh",
      strCountry: "Bangladesh",
    },
  ];

  const areas = Array.from(
    new Map(
      [...(areasData?.areas || []), ...staticAreas]
        .filter((area) => area?.strArea?.trim())
        .map((area) => [
          area.strArea.trim().toLowerCase(),
          {
            ...area,
            strArea: area.strArea.trim(),
          },
        ])
    ).values()
  );



  return (
    <main className="min-h-screen bg-[#FAF9F6] pb-16 pt-24 text-stone-900 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Welcome header */}
        <section className="mb-10 flex flex-col justify-between gap-5 sm:mb-14 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <Badge
              variant="outline"
              className="mb-5 rounded-full border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              YOUR DAILY DOSE OF INSPIRATION
            </Badge>

            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              What sounds
              <br className="hidden sm:block" />{" "}
              <span className="font-serif italic text-orange-600">
                delicious today?
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
              Discover something new, explore flavors from around the world,
              and find your next favorite meal.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-stone-200/80 bg-white px-4 py-3 shadow-sm sm:self-start md:self-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
              <ChefHat className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Your kitchen, your rules</p>
              <p className="mt-0.5 text-xs text-stone-500">
                Inspiration starts here
              </p>
            </div>
          </div>
        </section>

        {/* Recipe of the day */}
        {recipeOfTheDay && (
          <section className="mb-16 sm:mb-20">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-600" />
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
                    Handpicked for you
                  </span>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Recipe of the day
                </h2>
              </div>

              <Badge
                variant="outline"
                className="hidden rounded-full border-orange-200 bg-orange-50 px-3 py-1.5 text-orange-700 sm:inline-flex"
              >
                Today&apos;s special
              </Badge>
            </div>


            <Link
              href={`/recipes/${recipeOfTheDay.idMeal}`}
              className="group block"
            >

              <article className="grid overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-xl hover:shadow-stone-900/5 md:grid-cols-2">
                {/* Recipe image */}
                <div className="relative min-h-[280px] overflow-hidden bg-stone-100 sm:min-h-[380px] md:min-h-[440px]">
                  <Image
                    src={recipeOfTheDay.strMealThumb}
                    alt={recipeOfTheDay.strMeal}
                    fill
                    priority
                    sizes="(max-width: 767px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

                  <Badge className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm hover:bg-white sm:left-6 sm:top-6">
                    <Flame className="mr-1.5 h-3.5 w-3.5 text-orange-600" />
                    Today&apos;s pick
                  </Badge>

                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 sm:bottom-6 sm:left-6 sm:right-6">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                      <UtensilsCrossed className="h-3.5 w-3.5" />
                      {recipeOfTheDay.strCategory || "Featured recipe"}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                      <Globe className="h-3.5 w-3.5" />
                      {recipeOfTheDay.strArea || "World cuisine"}
                    </span>
                  </div>
                </div>

                {/* Recipe details */}
                <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
                  <div className="mb-5 flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
                    >
                      {recipeOfTheDay.strCategory}
                    </Badge>

                    <Badge
                      variant="outline"
                      className="rounded-full border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600"
                    >
                      {recipeOfTheDay.strArea} cuisine
                    </Badge>
                  </div>

                  <h3 className="text-3xl font-semibold leading-tight tracking-tight transition-colors group-hover:text-orange-600 sm:text-4xl lg:text-[2.75rem]">
                    {recipeOfTheDay.strMeal}
                  </h3>

                  <p className="mt-4 line-clamp-4 text-sm leading-7 text-stone-600 sm:text-base">
                    {recipeOfTheDay.strInstructions
                      ? `${recipeOfTheDay.strInstructions
                        .replace(/\s+/g, " ")
                        .trim()
                        .slice(0, 220)
                        .trim()}${recipeOfTheDay.strInstructions.length > 220 ? "..." : ""}`
                      : "Discover the ingredients, explore the preparation, and bring this delicious recipe to your table."}
                  </p>

                  {recipeOfTheDay.strTags && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {recipeOfTheDay.strTags
                        .split(",")
                        .slice(0, 3)
                        .map((tag) => (
                          <span
                            key={tag.trim()}
                            className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs text-stone-600"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-6">
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Clock3 className="h-4 w-4 text-orange-600" />
                      <span>Ready when you are</span>
                    </div>

                    <Button className="h-12 rounded-full bg-orange-600 px-6 font-semibold text-white shadow-md shadow-orange-600/15 transition-all hover:-translate-y-0.5 hover:bg-orange-700">
                      Explore Recipe
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </article>
            </Link>
          </section>
        )}

        {/* Browse by category */}
        <section className="mb-16 sm:mb-20">
          <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
                Find your craving
              </p>

              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Explore by category
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-500 sm:text-base">
                From comforting classics to something completely new.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-7">
            {categories.map((category) => (
              <Link
                key={category.strCategory}
                href={`/recipes/category/${category.strCategory.toLowerCase()}`}
                className="group"
              >
                <article className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-2xl border border-stone-200/80 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-900/5 sm:min-h-[155px] sm:p-5">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-orange-100">
                    {getCategoryEmoji(category.strCategory)}
                  </div>

                  <h3 className="text-sm font-semibold text-stone-800 transition-colors group-hover:text-orange-600">
                    {category.strCategory}
                  </h3>

                  <ArrowRight className="mt-2 h-4 w-4 text-stone-300 transition-all group-hover:translate-x-1 group-hover:text-orange-600" />
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* Explore world cuisines */}
        <section className="pb-4">
          <div className="mb-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
              A world of flavor
            </p>

            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Explore world cuisines
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500 sm:text-base">
              Take your taste buds on a journey and discover dishes inspired by
              kitchens around the world.
            </p>
          </div>



          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {areas
              .filter(
                (area) => area.strArea.toLowerCase() !== "bangladesh"
              )
              .map((area) => {
                const flagClass = getCountryFlag(area.strCountry);

                return (
                  <Link
                    key={`${area.strCountry}-${area.strArea}`}
                    href={`/recipes/cuisine/${getCountrySlug(area.strArea)}`}
                    className="group"
                  >
                    <article className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:border-orange-200 hover:bg-orange-50/40 hover:shadow-md sm:p-5">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-50 transition-colors group-hover:bg-orange-100">
                          {flagClass ? (
                            <span
                              className={`${flagClass} text-3xl`}
                              role="img"
                              aria-label={`${area.strCountry} flag`}
                            />
                          ) : (
                            <span
                              className="text-xs font-semibold text-stone-400"
                              aria-label="Flag unavailable"
                            >
                              N/A
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-stone-800 transition-colors group-hover:text-orange-600 sm:text-base">
                            {area.strArea}
                          </h3>

                          <p className="mt-1 truncate text-xs text-stone-500">
                            Find the Local Quisine
                          </p>
                        </div>
                      </div>

                      <ArrowRight className="h-4 w-4 shrink-0 text-stone-400 transition-all group-hover:translate-x-1 group-hover:text-orange-600" />
                    </article>
                  </Link>
                );
              })}
          </div>



        </section>
      </div>
    </main>
  );
}
