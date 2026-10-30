import {
  Show,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import { Refrigerator, Cookie, Sparkles } from "lucide-react";
import UserDropdown from "./UserDropdown";
import PricingModal from "./PricingModal";
import { Badge } from "./ui/badge";

function SubscriptionBadge({ isPro }) {

  return (
    <PricingModal subscriptionTier={isPro ? "pro" : "free"}>
      <Badge
        variant="outline"
        className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all ${
          isPro
            ? "border-none bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-sm"
            : "border border-stone-200 bg-stone-200/50 text-stone-600 hover:border-stone-300 hover:bg-stone-300/50"
        }`}
      >
        <Sparkles
          className={`h-3 w-3 ${
            isPro ? "fill-white/20 text-white" : "text-stone-500"
          }`}
        />
        <span>{isPro ? "Pro Chef" : "Free Plan"}</span>
      </Badge>
    </PricingModal>
  );
}

function SubscriptionBadgeFallback() {
  return (
    <div className="h-8 w-24 animate-pulse rounded-full bg-stone-200" />
  );
}

const Header = async () => {
  // Only resolve Clerk authentication here; don't wait for Strapi.
  const { userId, has } = await auth();
  const isPro = userId ? has({ plan: "pro" }) : false;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-stone-50/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo: dashboard for signed-in users, homepage otherwise */}
        <Link
          href={userId ? "/dashboard" : "/"}
          aria-label="Essora home"
          className="flex shrink-0 items-center"
        >
          <Image
            src="/essora_logo.png"
            alt="Essora"
            width={60}
            height={60}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Navigation links */}
        <div className="hidden items-center gap-6 text-sm font-medium text-stone-600 md:flex lg:gap-8">
          <Link
            href="/recipes"
            className="flex items-center gap-1.5 transition-colors hover:text-orange-600"
          >
            <Cookie className="h-4 w-4" />
            My Recipes
          </Link>

          <Link
            href="/pantry"
            className="flex items-center gap-1.5 transition-colors hover:text-orange-600"
          >
            <Refrigerator className="h-4 w-4" />
            My Pantry
          </Link>
        </div>

        {/* Authentication and profile */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                className="font-medium text-stone-600 hover:bg-orange-50 hover:text-orange-600"
              >
                Sign In
              </Button>
            </SignInButton>

            <SignUpButton mode="modal">
              <Button
                variant="primary"
                className="cursor-pointer rounded-full px-4 sm:px-6"
              >
                Get Started
              </Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            {/* The badge uses the plan already resolved from Clerk auth. */}
            <Suspense fallback={<SubscriptionBadgeFallback />}>
              <SubscriptionBadge isPro={isPro} />
            </Suspense>

            {/* Keep your existing profile dropdown */}
            <UserDropdown />
          </Show>
        </div>
      </nav>
    </header>
  );
};

export default Header;