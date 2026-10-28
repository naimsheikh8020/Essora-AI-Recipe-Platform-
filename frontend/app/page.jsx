import Reveal from "@/components/Reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Suspense } from "react";
import HomePricing from "@/components/HomePricing";
import {
  FEATURES,
  HOW_IT_WORKS_STEPS,
  SITE_STATS,
} from "@/lib/data";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Clock,
  Flame,
  Leaf,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import PricingSection from "@/components/PricingSection";

export default async function Home() {


  return (
    <main className="w-full min-w-0 overflow-x-clip bg-[#FAF9F6] text-stone-900">
      {/* ==================== HERO ==================== */}
      <section className="relative px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 md:px-8 md:pb-28 md:pt-32">
        <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl sm:h-96 sm:w-96" />

        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 sm:gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-20">
          {/* Hero content */}
          <Reveal>
            <div className="min-w-0 w-full text-center lg:text-left">
              <Badge
                variant="outline"
                className="mb-6 inline-flex max-w-full items-center rounded-full border-orange-200 bg-orange-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-orange-700 sm:px-4 sm:text-xs sm:tracking-[0.16em]"
              >
                <Flame className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                Your personal AI cooking assistant
              </Badge>

              <h1 className="mx-auto mb-6 max-w-3xl text-[clamp(2.35rem,8vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:mx-0 lg:text-[5rem] xl:text-[5.4rem]">
                Less food waste.
                <br />
                <span className="font-serif font-medium italic text-orange-600">
                  More delicious
                </span>
                <br />
                possibilities.
              </h1>

              <p className="mx-auto mb-8 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8 md:text-xl lg:mx-0">
                Your fridge is full of possibilities. Discover what to cook
                with the ingredients you already have, powered by AI.
              </p>

              <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="xl"
                    className="h-12 w-full rounded-full bg-orange-600 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-orange-700 sm:h-14 sm:w-auto sm:px-8 sm:text-base"
                  >
                    Start cooking for free
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-stone-600 transition-colors hover:text-orange-700"
                >
                  See how it works
                  <ArrowDown className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-stone-500 sm:gap-4 lg:justify-start">
                <div className="flex -space-x-2">
                  {["E", "S", "S", "O", "R", "A"].map((letter, index) => (
                    <div
                      key={`${letter}-${index}`}
                      className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FAF9F6] bg-orange-100 text-xs font-bold text-orange-800"
                      style={{ zIndex: 4 - index }}
                    >
                      {letter}
                    </div>
                  ))}
                </div>

                <span>
                  <strong className="font-semibold text-stone-900">
                    Cook smarter
                  </strong>{" "}
                  with what you have.
                </span>
              </div>
            </div>
          </Reveal>

          {/* Hero image */}
          <Reveal delay={0.12} distance={28}>
            <div className="relative mx-auto w-full min-w-0 max-w-lg">
              <div className="absolute -inset-1.5 rotate-2 rounded-[1.75rem] bg-orange-100/80 sm:-inset-3 sm:rounded-[2.5rem] sm:rotate-3" />

              <div className="relative aspect-[4/4.7] w-full overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-100 shadow-xl shadow-stone-900/10 sm:rounded-[2rem] sm:shadow-2xl">
                <Image
                  src="/pasta-dish.png"
                  alt="Fresh tomato basil pasta ready to serve"
                  fill
                  priority
                  sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) 80vw, 45vw"
                  className="object-cover transition-transform duration-1000 hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/65 via-transparent to-stone-950/5" />

                <div className="absolute left-3 top-3 flex max-w-[calc(100%-24px)] items-center gap-2 rounded-full border border-white/30 bg-white/90 px-3 py-2 text-[10px] font-semibold text-stone-800 shadow-lg backdrop-blur-md sm:left-5 sm:top-5 sm:px-4 sm:text-xs">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-orange-600 sm:h-4 sm:w-4" />
                  Made with what you have
                </div>

                {/* Floating recipe card */}
                <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/70 bg-white/95 p-3 shadow-2xl backdrop-blur-xl sm:bottom-7 sm:left-7 sm:right-7 sm:rounded-2xl sm:p-5 md:p-6">
                  <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-orange-700 sm:text-xs sm:tracking-widest">
                        Tonight&apos;s inspiration
                      </p>

                      <h2 className="break-words text-sm font-semibold leading-snug tracking-tight sm:text-lg md:text-xl">
                        Rustic Tomato Basil Pasta
                      </h2>

                      <div className="mt-2 flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className="h-3 w-3 fill-orange-500 text-orange-500 sm:h-3.5 sm:w-3.5"
                          />
                        ))}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-green-50 px-2 py-1 text-[9px] font-semibold text-green-700 sm:px-2.5 sm:text-xs">
                      Easy
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-stone-200 pt-3 text-[10px] text-stone-600 sm:gap-4 sm:pt-4 sm:text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      25 minutes
                    </span>

                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      2 servings
                    </span>

                    <span className="flex items-center gap-1">
                      <Leaf className="h-3 w-3 text-green-600 sm:h-4 sm:w-4" />
                      Fresh
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating badge: tablet and desktop only */}
              <div className="absolute -right-3 top-1/3 hidden max-w-[220px] rounded-2xl border border-stone-200 bg-white p-3 shadow-xl md:block lg:-right-5 lg:p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 lg:h-10 lg:w-10">
                    <Check className="h-5 w-5 text-green-700" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold lg:text-sm">
                      Less food waste
                    </p>
                    <p className="text-[10px] leading-4 text-stone-500 lg:text-xs">
                      Use what&apos;s in your fridge
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================== STATS ==================== */}
      <section className="border-y border-stone-800 bg-[#201B18] px-4 py-10 sm:px-6 sm:py-12 md:px-8 md:py-14">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 md:grid-cols-4 md:gap-6">
          {SITE_STATS.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.06} distance={15}>
              <div className="min-w-0 text-center">
                <p className="mb-2 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
                  {stat.val}
                </p>

                <p className="break-words text-[9px] font-semibold uppercase leading-4 tracking-[0.12em] text-orange-400 sm:text-[10px] sm:tracking-[0.16em] md:text-xs">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section
        id="features"
        className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-10 flex flex-col justify-between gap-4 sm:mb-12 md:mb-16 md:flex-row md:items-end">
              <div className="min-w-0">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-700 sm:text-xs">
                  A smarter way to cook
                </p>

                <h2 className="text-3xl font-semibold tracking-[-0.05em] sm:text-4xl md:text-5xl lg:text-6xl">
                  Your kitchen.
                  <br />
                  <span className="font-serif font-medium italic text-stone-500">
                    Reimagined.
                  </span>
                </h2>
              </div>

              <p className="max-w-md text-sm leading-7 text-stone-600 sm:text-base md:text-lg">
                From forgotten ingredients to your next favorite meal,
                everything starts with what you already have.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {FEATURES.map((feature, index) => {
              const IconComponent = feature.icon;

              return (
                <Reveal
                  key={feature.title}
                  delay={(index % 2) * 0.08}
                  distance={20}
                >
                  <Card className="group h-full min-w-0 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-stone-900/5 sm:rounded-3xl">
                    <CardContent className="flex h-full flex-col p-5 sm:p-7 md:p-9">
                      <div className="mb-7 flex items-start justify-between gap-3 sm:mb-9">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700 transition-colors duration-300 group-hover:bg-orange-600 group-hover:text-white sm:h-14 sm:w-14 sm:rounded-2xl">
                          <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>

                        <Badge
                          variant="secondary"
                          className="max-w-[65%] whitespace-normal break-words rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-right text-[9px] font-semibold uppercase leading-4 tracking-wide text-stone-600 sm:px-3 sm:text-[10px]"
                        >
                          {feature.limit}
                        </Badge>
                      </div>

                      <h3 className="mb-3 break-words text-lg font-semibold tracking-tight sm:text-xl md:text-2xl">
                        {feature.title}
                      </h3>

                      <p className="flex-1 break-words text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
                        {feature.description}
                      </p>

                      <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-orange-700 transition-all duration-300 group-hover:gap-3 sm:text-sm">
                        Discover more
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section
        id="how-it-works"
        className="scroll-mt-20 bg-[#201B18] px-4 py-16 text-white sm:px-6 sm:py-20 md:px-8 md:py-32"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <Reveal>
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 sm:text-xs">
                Simple by design
              </p>

              <h2 className="mb-5 text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-4xl md:text-5xl lg:text-6xl">
                From fridge
                <br />
                to{" "}
                <span className="font-serif italic text-orange-400">
                  fork.
                </span>
              </h2>

              <p className="max-w-md text-sm leading-7 text-stone-400 sm:text-base sm:leading-8 md:text-lg">
                Great meals don&apos;t need complicated planning. Let Essora
                help you turn everyday ingredients into something special.
              </p>

              <Link
                href="/dashboard"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-orange-500 sm:mt-8"
              >
                Try Essora for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <div className="min-w-0">
            {HOW_IT_WORKS_STEPS.map((item, index) => (
              <Reveal
                key={item.step}
                delay={index * 0.08}
                distance={18}
              >
                <div className="group grid grid-cols-[48px_minmax(0,1fr)] gap-4 border-b border-white/10 py-7 first:pt-0 last:border-b-0 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-6 sm:py-9 md:grid-cols-[88px_minmax(0,1fr)] md:gap-8">
                  <span className="font-serif text-3xl italic text-orange-500 transition-colors duration-300 group-hover:text-orange-300 sm:text-5xl md:text-6xl">
                    {String(item.step).padStart(2, "0")}
                  </span>

                  <div className="min-w-0">
                    <h3 className="mb-2 break-words text-lg font-semibold tracking-tight sm:mb-3 sm:text-xl md:text-2xl">
                      {item.title}
                    </h3>

                    <p className="max-w-lg break-words text-sm leading-7 text-stone-400 sm:text-base sm:leading-8">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section
        id="pricing"
        className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-32"
      >


        <Reveal delay={0.08} distance={18}>
          <Suspense
            fallback={
              <div className="mx-auto min-h-96 max-w-5xl animate-pulse rounded-3xl bg-stone-100" />
            }
          >
            <HomePricing />
          </Suspense>
        </Reveal>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20 md:px-8 md:pb-28">
        <Reveal>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-orange-600 px-5 py-12 text-center sm:rounded-[2rem] sm:px-10 sm:py-16 md:px-12 md:py-20">
            <div className="pointer-events-none absolute -left-20 -top-28 h-48 w-48 rounded-full border border-white/10 sm:h-72 sm:w-72" />

            <div className="pointer-events-none absolute -bottom-32 -right-16 h-64 w-64 rounded-full border border-white/10 sm:h-96 sm:w-96" />

            <div className="relative mx-auto max-w-2xl">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 sm:mb-6 sm:h-14 sm:w-14 sm:rounded-2xl">
                <Sparkles className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>

              <h2 className="mb-4 text-2xl font-semibold leading-tight tracking-[-0.04em] text-white sm:mb-5 sm:text-3xl md:text-4xl lg:text-5xl">
                Your next favorite meal is already in your kitchen.
              </h2>

              <p className="mx-auto mb-7 max-w-xl text-sm leading-7 text-orange-50 sm:mb-8 sm:text-base md:text-lg">
                Open your fridge, bring your ingredients, and let&apos;s
                create something delicious.
              </p>

              <Link href="/dashboard" className="inline-block w-full sm:w-auto">
                <Button
                  size="xl"
                  className="h-12 w-full rounded-full bg-white px-7 text-sm font-semibold text-orange-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-orange-50 sm:h-14 sm:w-auto sm:px-8 sm:text-base"
                >
                  Start cooking free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}