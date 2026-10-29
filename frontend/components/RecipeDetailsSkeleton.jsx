
import { Skeleton } from "@/components/ui/skeleton";

export default function RecipeDetailsSkeleton() {
  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {/* Back link */}
        <Skeleton className="h-5 w-32 rounded-md" />

        {/* Recipe hero */}
        <section className="mt-8 grid gap-8 md:grid-cols-2 md:items-center">
          {/* Image placeholder */}
          <Skeleton className="aspect-[4/3] w-full rounded-3xl" />

          {/* Recipe information */}
          <div className="space-y-5">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
            </div>

            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            <Skeleton className="h-5 w-3/4 rounded-md" />

            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            <div className="flex gap-3 pt-3">
              <Skeleton className="h-12 w-40 rounded-full" />
              <Skeleton className="h-12 w-36 rounded-full" />
            </div>
          </div>
        </section>

        {/* Ingredients and instructions */}
        <section className="mt-16 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Ingredients skeleton */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
            <Skeleton className="mb-3 h-8 w-40" />
            <Skeleton className="mb-8 h-4 w-28" />

            <div className="space-y-5">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 border-b border-stone-100 pb-4 last:border-0"
                >
                  <Skeleton className="size-5 shrink-0 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Instructions skeleton */}
          <div>
            <Skeleton className="mb-3 h-8 w-56" />
            <Skeleton className="mb-8 h-4 w-64 max-w-full" />

            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"
                >
                  <Skeleton className="size-10 shrink-0 rounded-full" />

                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Video placeholder */}
        <section className="mt-16">
          <Skeleton className="mb-6 h-8 w-48" />
          <Skeleton className="aspect-video w-full rounded-3xl" />
        </section>
      </div>
    </main>
  );
}
