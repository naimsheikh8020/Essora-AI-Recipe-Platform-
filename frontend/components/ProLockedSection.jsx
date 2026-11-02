
"use client";

import PricingModal from "@/components/PricingModal";
import { LockKeyhole } from "lucide-react";

export default function ProLockedSection({
  isPro,
  lockText,
  ctaText = "Upgrade to Pro →",
  children,
}) {
  return (
    <div className="relative">
      {/* Locked content with blur */}
      <div className={!isPro ? "blur-sm pointer-events-none select-none" : ""}>
        {children}
      </div>

      {/* Upgrade overlay */}
      {!isPro && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="bg-white/90 border border-stone-200 rounded-xl px-4 py-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-stone-900">
              <LockKeyhole className="h-4 w-4 text-orange-600" />
              {lockText}
            </div>

            <PricingModal>
              {ctaText}
            </PricingModal>
          </div>
        </div>
      )}
    </div>
  );
}
