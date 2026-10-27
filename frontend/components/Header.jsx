
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Suspense } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import { Refrigerator, Cookie } from "lucide-react";

const Header = async () => {
  const user = null; // Replace with actual user authentication logic
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-stone-50/80 backdrop-blur-md supports-backdrop-filter:bg-stone-50/60">
      <nav className="container mx-auto flex h-16 py-10 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={user ? "/dashboard" : "/"}
        >
          <Image
            src="/essora_logo.png"
            alt="Logo"
            width={60}
            height={60}
            className="w-16"
          />
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-stone-600">
          <Link
            href="/recipes"
            className="hover:text-orange-600 transition-colors flex gap-1.5 items-center"
          >
            <Cookie className="w-4 h-4" />
            My Recipes
          </Link>
          <Link
            href="/pantry"
            className="hover:text-orange-600 transition-colors flex gap-1.5 items-center"
          >
            <Refrigerator className="w-4 h-4" />
            My Pantry
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
              {/* How to Cook */}
              <UserButton />
            </Show>
          </Suspense>
        </div>
      </nav>
    </header>
  );
};

export default Header;
