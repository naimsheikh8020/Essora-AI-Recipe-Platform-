import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";

import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { neobrutalism } from "@clerk/themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Essora - AI Recipes Platform",
  description: "AI-Powered Recipes Platform for Food Lovers",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        theme: neobrutalism,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
          <Suspense
            fallback={
              <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-stone-200 bg-stone-50/80" />
            }
          >
            <Header />
          </Suspense>

          <main className="min-h-screen pt-16">{children}</main>

          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}