import Image from "next/image";

const Footer = () => {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
        {/* Main Footer */}
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:text-left">
          {/* Brand */}
          <div className="flex min-w-0 flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <Image
              src="/essora_logo.png"
              alt="Essora"
              width={120}
              height={120}
              className="h-14 w-auto shrink-0 object-contain"
            />

            <div className="min-w-0 sm:border-l sm:border-stone-200 sm:pl-4">
              <p className="text-sm font-semibold tracking-tight text-stone-900 sm:text-base">
                Your kitchen, reimagined.
              </p>

              <p className="mt-1 text-sm text-stone-500">
                Eat better. Waste less.
              </p>
            </div>
          </div>

          {/* Creator */}
          <div className="flex flex-col items-center gap-3 sm:items-end">
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
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-600" />
              AI-powered meal planning
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center gap-3 border-t border-stone-200 pt-5 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
          <p className="text-xs leading-5 text-stone-500">
            © 2026 Essora. All rights reserved.
          </p>

          <p className="text-xs leading-5 text-stone-400">
            Made for better everyday meals.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;