import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { connection } from "next/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Essora - Ai Recipes Platform",
  description: "Ai Powered Recipes Platform for Food Lovers",
};

export default function RootLayout({ children }) {
  
  
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={`${inter.className} `}>
        <main className="min-h-screen">
          {children}
        </main>
        {/* Footer */}

        <footer className="border-t border-stone-200 bg-stone-50">
          <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              {/* Brand */}
              <div className="flex items-center gap-4">
                <Image
                  src="/essora_logo.png"
                  alt="Essora"
                  width={120}
                  height={120}
                  className="h-14 w-auto object-contain"
                />

                <div className="border-l border-stone-200 pl-4">
                  <p className="text-sm font-semibold tracking-tight text-stone-900">
                    Your kitchen, reimagined.
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    Eat better. Waste less.
                  </p>
                </div>
              </div>

              {/* Creator */}
              <div className="flex flex-col gap-2 sm:items-end">
                <p className="text-sm text-stone-600">
                  Made with{" "}
                  <span className="text-orange-600" aria-label="love">
                     💗 
                  </span>{" "}
                  by{" "}
                  <span className="font-semibold text-stone-900">
                    Naim Sheikh
                  </span>
                </p>

                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                  AI-powered meal planning
                </span>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-8 flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="mt-8 flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-stone-500">
                  
                  {`© 2026 Essora. All rights reserved.`}
                </p>
              </div>

              <p className="text-xs text-stone-400">
                Made for better everyday meals.
              </p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
