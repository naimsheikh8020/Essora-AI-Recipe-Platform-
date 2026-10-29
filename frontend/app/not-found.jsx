import Link from "next/link";
import {
  ArrowRight,
  ChefHat,
  CookingPot,
  Home,
  Search,
  Sparkles,
  Utensils,
} from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-orange-50/30 px-4 py-12 text-neutral-900 sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-3 lg:gap-8">
        {/* Left Illustration */}
        <div className="relative hidden items-center justify-center lg:flex">
          <div className="relative w-full max-w-sm">
            <span className="absolute -left-4 top-4 z-10 -rotate-12 rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm">
              Still hungry?
            </span>

            <div className="rounded-3xl bg-orange-100 p-3 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&q=85"
                alt="A welcoming kitchen"
                className="aspect-square w-full rounded-2xl object-cover"
              />
            </div>

            <div className="absolute -bottom-5 -right-4 flex size-16 items-center justify-center rounded-2xl border border-orange-100 bg-white text-orange-600 shadow-lg">
              <CookingPot size={30} strokeWidth={1.6} />
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="mx-auto w-full max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-100/70 px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-700">
            <Sparkles size={14} />
            Error 404 · Page not found
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Oops!
            <br />
            This page is missing
            <br />
            from our{" "}
            <span className="font-serif italic text-orange-600">
              recipe book.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-neutral-500 sm:text-base">
            We couldn&apos;t find the page you&apos;re looking for. It might
            have been moved, removed, or never existed. Let&apos;s get you
            back to something delicious!
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <Home size={18} />
              Go to Home
              <ArrowRight size={17} />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <Utensils size={18} />
              Explore Recipes
            </Link>
          </div>

          <p className="mt-8 text-sm text-neutral-400">
            Lost your way? Let&apos;s get cooking again.
          </p>
        </div>

        {/* Right Illustration */}
        <div className="relative hidden w-full max-w-sm items-center justify-center lg:flex lg:flex-col">
          <p className="mb-5 font-serif text-lg italic text-neutral-500">
            This recipe went on vacation...
          </p>

          <div className="flex aspect-square w-full items-center justify-center rounded-3xl border border-orange-100 bg-white shadow-xl shadow-orange-950/5">
            <div className="flex size-48 items-center justify-center rounded-full border-2 border-dashed border-orange-200 bg-orange-50/50">
              <div className="text-center">
                <Search
                  size={36}
                  className="mx-auto mb-3 text-orange-400"
                  strokeWidth={1.5}
                />

                <span className="text-7xl font-black text-orange-200">?</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-0 flex size-16 items-center justify-center rounded-2xl border border-orange-100 bg-white text-orange-600 shadow-lg">
            <ChefHat size={30} strokeWidth={1.6} />
          </div>
        </div>
      </section>
    </main>
  );
}