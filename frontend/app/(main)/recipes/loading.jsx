export default function Loading() {
  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 pb-20 pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="h-10 w-64 animate-pulse rounded bg-stone-200" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200"
            >
              <div className="h-52 animate-pulse bg-stone-200" />
              <div className="space-y-3 p-5">
                <div className="h-5 animate-pulse rounded bg-stone-200" />
                <div className="h-4 animate-pulse rounded bg-stone-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
