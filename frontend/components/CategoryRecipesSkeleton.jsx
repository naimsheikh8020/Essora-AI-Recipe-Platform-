
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryRecipesSkeleton() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] pb-16 pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Skeleton className="mb-8 h-5 w-32" />

        {/* Category heading */}
        <section className="mb-10 sm:mb-12">
          <Skeleton className="mb-3 h-4 w-32" />
          <Skeleton className="h-10 w-64 max-w-full sm:h-12 sm:w-80" />
          <Skeleton className="mt-4 h-4 w-full max-w-lg" />
          <Skeleton className="mt-2 h-4 w-3/4 max-w-md" />
        </section>

        {/* Search and filters */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-11 w-full rounded-xl sm:max-w-sm" />
          <Skeleton className="h-11 w-full rounded-xl sm:max-w-40" />
        </div>

        {/* Recipe grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <article
              key={index}
              className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm"
            >
              {/* Recipe image */}
              <Skeleton className="aspect-[4/3] w-full rounded-none" />

              {/* Recipe information */}
              <div className="space-y-3 p-5">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />

                <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
