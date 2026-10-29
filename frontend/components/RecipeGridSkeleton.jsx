
export default function RecipeGridSkeleton({ count = 8 }) {
  return (
    <section className="max-w-7xl mx-auto animate-pulse">
      {/* Page heading skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-8 w-56 rounded-lg bg-neutral-200" />
        <div className="h-4 w-72 max-w-full rounded bg-neutral-200" />
      </div>

      {/* Search and filter skeleton */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-11 w-full rounded-xl bg-neutral-200 sm:max-w-sm" />

        <div className="flex gap-3">
          <div className="h-10 w-24 rounded-lg bg-neutral-200" />
          <div className="h-10 w-24 rounded-lg bg-neutral-200" />
        </div>
      </div>

      {/* Recipe cards skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
          >
            {/* Recipe image */}
            <div className="aspect-[4/3] w-full bg-neutral-200" />

            {/* Recipe information */}
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="h-5 w-20 rounded-full bg-neutral-200" />
                <div className="h-4 w-14 rounded bg-neutral-200" />
              </div>

              <div className="space-y-2">
                <div className="h-5 w-full rounded bg-neutral-200" />
                <div className="h-5 w-3/4 rounded bg-neutral-200" />
              </div>

              <div className="h-4 w-full rounded bg-neutral-200" />

              <div className="flex items-center justify-between pt-2">
                <div className="h-4 w-24 rounded bg-neutral-200" />
                <div className="h-9 w-9 rounded-full bg-neutral-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
