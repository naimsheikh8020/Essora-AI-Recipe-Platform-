"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-6 py-16">
      <div className="w-full max-w-lg text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-orange-600">
          <AlertTriangle size={38} strokeWidth={1.8} />
        </div>

        {/* Error Code */}
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-orange-600">
          Something went wrong
        </p>

        {/* Heading */}
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
          Oops! That&apos;s not in the recipe.
        </h1>

        {/* Description */}
        <p className="mx-auto mb-8 max-w-md text-base leading-7 text-neutral-500">
          Something unexpected happened while preparing your experience.
          Please try again, or return to Essora and discover something delicious.
        </p>

        {/* Actions */}
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <RefreshCw size={18} />
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-3.5 font-semibold text-neutral-700 transition hover:border-orange-200 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <ArrowLeft size={18} />
            Back to home
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-neutral-200 pt-6">
          <p className="text-sm font-semibold tracking-wide text-neutral-800">
            essora<span className="text-orange-600">.</span>
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Good food starts with a little inspiration.
          </p>
        </div>
      </div>
    </main>
  );
}