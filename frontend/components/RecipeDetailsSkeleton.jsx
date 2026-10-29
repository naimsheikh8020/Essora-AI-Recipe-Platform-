
import { Skeleton } from "@/components/ui/skeleton";

export default function RecipeDetailsSkeleton() {
  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <div className="mb-8 flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Recipe heading */}
        <div className="mb-8 space-y-4">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-10 w-full max-w-2xl sm:h-12" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-3/4 max-w-lg" />
        </div>

        {/* Recipe image and information */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Main image */}
          <Skeleton className="aspect-[4/3] w-full rounded-3xl" />

          {/* Recipe information */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-stone-200 bg-white p-4"
                >
                  <Skeleton className="mb-3 h-8 w-8 rounded-lg" />
                  <Skeleton className="mb-2 h-3 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-11 w-36 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
          </div>
        </div>

        {/* Ingredients and instructions */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Ingredients */}
          <section className="rounded-3xl border border-stone-200 bg-white p-6">
            <Skeleton className="mb-6 h-7 w-36" />

            <div className="space-y-5">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                  <Skeleton
                    className={`h-4 ${
                      index % 2 === 0 ? "w-3/4" : "w-1/2"
                    }`}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Instructions */}
          <section className="rounded-3xl border border-stone-200 bg-white p-6">
            <Skeleton className="mb-6 h-7 w-40" />

            <div className="space-y-7">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex gap-4">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />

                  <div className="flex-1 space-y-3 pt-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
