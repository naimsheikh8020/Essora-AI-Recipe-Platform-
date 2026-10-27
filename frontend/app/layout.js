
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Essora - AI Recipes Platform",
  description: "AI-Powered Recipes Platform for Food Lovers",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <Header />

          <main className="min-h-screen pt-16">
            {children}
          </main>

          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}


