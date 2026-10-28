
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { Show, SignInButton } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  ChefHat,
  Sparkles,
} from "lucide-react";

const freeFeatures = [
  "10 pantry scans per month",
  "5 AI meal recommendations",
  "Standard recipe access",
  "Standard support",
];

const proFeatures = [
  "Unlimited pantry scans",
  "Unlimited AI recipes",
  "Personalized recipe recommendations",
  "Nutritional analysis",
  "Chef's tips and tricks",
  "Ingredient substitutions",
  "Priority support",
];

function FeatureList({ features, featured = false }) {
  return (
    <ul className="space-y-4">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              featured
                ? "bg-orange-100 text-orange-700"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            <Check className="h-3 w-3" strokeWidth={2.5} />
          </span>

          <span className="text-sm leading-6 text-stone-700">
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}

async function HomePricingContent() {
  const { has } = await auth();

  const subscriptionTier = has({ plan: "pro" }) ? "pro" : "free";
  const isPro = subscriptionTier === "pro";

  return (
    <section
      id="pricing"
      aria-labelledby="home-pricing-heading"
      className="relative isolate w-full overflow-hidden bg-[#FAF9F6] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-20 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-200/30 blur-3xl sm:h-96 sm:w-96"
      />

      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <header className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2">
            <Sparkles className="h-3.5 w-3.5 text-orange-600" />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-700 sm:text-xs">
              Simple, honest pricing
            </span>
          </div>

          <h2
            id="home-pricing-heading"
            className="text-balance text-4xl font-semibold tracking-[-0.055em] text-stone-900 sm:text-5xl md:text-6xl"
          >
            Cook more.{" "}
            <span className="font-serif font-normal italic text-orange-600">
              Waste less.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-stone-600 sm:text-base sm:leading-8">
            Start with the essentials. Upgrade when you&apos;re ready for
            more. Make better meals with what you already have.
          </p>
        </header>

        {/* Pricing cards */}
        <div className="mx-auto grid max-w-4xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {/* Free plan */}
          <article className="flex min-w-0 flex-col rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-3">
              <div>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                  <ChefHat className="h-5 w-5" />
                </div>

                <h3 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
                  Sous Chef
                </h3>

                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Your everyday cooking companion.
                </p>
              </div>

              <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-medium text-stone-600">
                Free
              </span>
            </div>

            <div className="border-b border-stone-100 pb-7">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-[-0.06em] text-stone-900 sm:text-6xl">
                  $0
                </span>

                <span className="text-sm text-stone-500">/ month</span>
              </div>

              <p className="mt-3 text-sm text-stone-500">
                Everything you need to get started.
              </p>
            </div>

            <div className="flex-1 py-7">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.13em] text-stone-500">
                What&apos;s included
              </p>

              <FeatureList features={freeFeatures} />
            </div>

            <div className="mt-auto border-t border-stone-100 pt-6">
              <Show when="signed-in">
                <Button
                  asChild
                  variant="outline"
                  className="h-12 w-full rounded-xl border-stone-300 font-semibold text-stone-800 transition hover:border-stone-900 hover:bg-stone-900 hover:text-white"
                >
                  <a href="/dashboard">
                    Get started for free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </Show>

              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-xl border-stone-300 font-semibold text-stone-800 transition hover:border-stone-900 hover:bg-stone-900 hover:text-white"
                  >
                    Get started for free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignInButton>
              </Show>

              <p className="mt-3 text-center text-xs text-stone-400">
                No payment required
              </p>
            </div>
          </article>

          {/* Pro plan */}
          <article className="relative flex min-w-0 flex-col rounded-3xl border border-orange-300 bg-[#FFF9F2] p-6 shadow-[0_8px_36px_rgba(234,88,12,0.07)] transition duration-300 hover:-translate-y-1 hover:border-orange-400 hover:shadow-[0_18px_48px_rgba(234,88,12,0.12)] sm:p-8">
            <div className="absolute right-5 top-5 sm:right-7 sm:top-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-sm sm:text-xs">
                <Sparkles className="h-3 w-3" />
                Popular
              </span>
            </div>

            <div className="mb-7 pr-20 sm:pr-24">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                <Sparkles className="h-5 w-5" />
              </div>

              <h3 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
                Head Chef
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                For cooks ready to do more.
              </p>
            </div>

            <div className="border-b border-orange-200/70 pb-7">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-[-0.06em] text-orange-600 sm:text-6xl">
                  $7.99
                </span>

                <span className="text-sm text-stone-500">/ month</span>
              </div>

              <p className="mt-3 text-sm text-stone-600">
                More inspiration. Less food waste.
              </p>
            </div>

            <div className="flex-1 py-7">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.13em] text-orange-800/70">
                Everything in Free, plus
              </p>

              <FeatureList features={proFeatures} featured />
            </div>

            <div className="mt-auto border-t border-orange-200/70 pt-6">
              <Show when="signed-in">
                <CheckoutButton
                  planId="cplan_3LKgOdXldKu1fw5EkpGJUebedzw"
                  planPeriod="month"
                  newSubscriptionRedirectUrl="/dashboard"
                  checkoutProps={{
                    appearance: {
                      elements: {
                        drawerRoot: {
                          zIndex: 2000,
                        },
                      },
                    },
                  }}
                >
                  <Button
                    disabled={isPro}
                    className="h-12 w-full rounded-xl bg-orange-600 font-semibold text-white shadow-[0_4px_12px_rgba(234,88,12,0.18)] transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
                  >
                    {isPro ? "Current plan" : "Upgrade to Head Chef"}

                    {!isPro && (
                      <ArrowRight className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </CheckoutButton>
              </Show>

              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button className="h-12 w-full rounded-xl bg-orange-600 font-semibold text-white shadow-[0_4px_12px_rgba(234,88,12,0.18)] transition hover:bg-orange-700">
                    Login to subscribe
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignInButton>
              </Show>

              <p className="mt-3 text-center text-xs text-stone-500">
                Cancel anytime. Cook on your terms.
              </p>
            </div>
          </article>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs leading-6 text-stone-500 sm:text-sm">
          Start free and upgrade only when you need more.
          <span className="hidden sm:inline">{" "}·{" "}</span>
          <span className="block sm:inline">
            Made for better meals and less waste.
          </span>
        </p>
      </div>
    </section>
  );
}

function PricingFallback() {
  return (
    <section
      aria-label="Loading pricing"
      className="w-full bg-[#FAF9F6] px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto mb-12 max-w-xl animate-pulse text-center">
          <div className="mx-auto mb-5 h-7 w-40 rounded-full bg-stone-200" />
          <div className="mx-auto mb-4 h-12 max-w-md rounded-xl bg-stone-200" />
          <div className="mx-auto h-5 max-w-sm rounded-lg bg-stone-200" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-[460px] animate-pulse rounded-3xl border border-stone-200 bg-white p-6"
            >
              <div className="mb-6 h-10 w-10 rounded-xl bg-stone-200" />
              <div className="mb-4 h-7 w-32 rounded-lg bg-stone-200" />
              <div className="mb-8 h-12 w-36 rounded-lg bg-stone-200" />
              <div className="space-y-5">
                {[0, 1, 2, 3, 4].map((feature) => (
                  <div
                    key={feature}
                    className="h-4 rounded-md bg-stone-100"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePricing() {
  return (
    <Suspense fallback={<PricingFallback />}>
      <HomePricingContent />
    </Suspense>
  );
}
