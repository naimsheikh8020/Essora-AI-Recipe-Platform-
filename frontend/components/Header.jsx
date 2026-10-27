
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Suspense } from "react";
import { Button } from "./ui/button";
import Link from "next/link";

const Header = () => {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-stone-50/80 backdrop-blur-md supports-backdrop-filter:bg-stone-50/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-xl font-bold tracking-tight text-stone-900"
        >
          Essora
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-6 text-sm font-medium text-stone-600 md:flex">
          <Link
            href="/"
            className="transition-colors hover:text-orange-600"
          >
            Home
          </Link>

          <Link
            href="/recipes"
            className="transition-colors hover:text-orange-600"
          >
            Recipes
          </Link>

          <Link
            href="/meal-planner"
            className="transition-colors hover:text-orange-600"
          >
            Meal Planner
          </Link>
        </div>

        {/* Authentication */}
        <div className="flex shrink-0 items-center gap-2">
          <Suspense
            fallback={
              <div className="h-9 w-20 animate-pulse rounded-full bg-stone-200" />
            }
          >
            <Show when="signed-out">
              {/* Sign In Modal */}
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  className="cursor-pointer font-medium text-stone-600 hover:bg-orange-50 hover:text-orange-600"
                >
                  Sign In
                </Button>
              </SignInButton>

              {/* Sign Up Modal */}
              <SignUpButton mode="modal">
                <Button
                  variant="primary"
                  className="cursor-pointer rounded-full px-6"
                >
                  Get Started
                </Button>
              </SignUpButton>
            </Show>

            {/* Signed-in User */}
            <Show when="signed-in">
              <UserButton />
            </Show>
          </Suspense>
        </div>
      </nav>
    </header>
  );
};

export default Header;
