
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeDetails } from "@/actions/mealbd.action";
import RecipeDetailsSkeleton from "@/components/RecipeDetailsSkeleton";

export default function RecipeDetailsPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <RecipeDetailsSkeleton />
        </div>
      }
    >
      <RecipeDetailsContent params={params} />
    </Suspense>
  );
}

async function RecipeDetailsContent({ params }) {
  const { id } = await params;
  const result = await getRecipeDetails(id);

  if (!result.success || !result.recipe) {
    notFound();
  }

  const recipe = result.recipe;

  const instructions = recipe.instructions
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter(Boolean);

  const youtubeId = recipe.youtube?.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
  )?.[1];

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-orange-600"
        >
          <span aria-hidden="true">←</span>
          Back to recipes
        </Link>

        {/* Recipe header */}
        <section className="mt-8 grid gap-8 md:grid-cols-2 md:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-stone-200">
            <Image
              src={recipe.image}
              alt={recipe.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {recipe.category && (
                <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
                  {recipe.category}
                </span>
              )}

              {recipe.area && (
                <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600">
                  {recipe.area} cuisine
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              {recipe.name}
            </h1>

            <p className="mt-5 leading-7 text-stone-600">
              Explore the ingredients and follow the cooking instructions
              to prepare this recipe at home.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#ingredients"
                className="rounded-full bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700"
              >
                View ingredients
              </a>

              <a
                href="#instructions"
                className="rounded-full border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-800 transition hover:border-orange-600"
              >
                Start cooking
              </a>
            </div>

            {recipe.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-stone-200/70 px-3 py-1.5 text-xs text-stone-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Ingredients and instructions */}
        <section className="mt-16 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Ingredients */}
          <div
            id="ingredients"
            className="h-fit rounded-3xl border border-stone-200 bg-white p-6 sm:p-8"
          >
            <h2 className="text-2xl font-bold text-stone-900">
              Ingredients
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              {recipe.ingredients.length} ingredients
            </p>

            <ul className="mt-6 space-y-4">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={`${ingredient.name}-${index}`}
                  className="flex items-start gap-3 border-b border-stone-100 pb-4 last:border-0"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-orange-300 text-xs text-orange-600">
                    ✓
                  </span>

                  <span className="flex-1 text-stone-700">
                    {ingredient.name}
                  </span>

                  <span className="text-right text-sm font-medium text-stone-500">
                    {ingredient.measure}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cooking instructions */}
          <div id="instructions">
            <h2 className="text-2xl font-bold text-stone-900">
              Cooking instructions
            </h2>

            <p className="mt-2 text-stone-500">
              Follow the instructions to prepare your recipe.
            </p>

            <div className="mt-6 space-y-5">
              {instructions.map((step, index) => (
                <article
                  key={index}
                  className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">
                    {index + 1}
                  </div>

                  <div>
                    <h3 className="font-semibold text-stone-900">
                      Step {index + 1}
                    </h3>

                    <p className="mt-2 whitespace-pre-line leading-7 text-stone-600">
                      {step}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* YouTube video */}
        {youtubeId && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-stone-900">
              Watch the recipe
            </h2>

            <div className="mt-6 aspect-video overflow-hidden rounded-3xl bg-stone-200">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                title={`${recipe.name} cooking tutorial`}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* Original source */}
        {recipe.source && (
          <div className="mt-10 border-t border-stone-200 pt-6">
            <a
              href={recipe.source}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-orange-700 underline underline-offset-4 hover:text-orange-800"
            >
              View original recipe source ↗
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
