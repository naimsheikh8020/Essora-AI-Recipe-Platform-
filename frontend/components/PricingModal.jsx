
"use client";

import React from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import PricingSection from "./PricingSection";

const PricingModal = ({
  subscriptionTier = "free",
  children = "Upgrade to Pro",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const canOpen = subscriptionTier === "free";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (canOpen) {
          setIsOpen(open);
        }
      }}
    >
      <DialogTrigger
        disabled={!canOpen}
        render={
          <Button
            type="button"
            variant="ghost"
            className="text-orange-600 hover:text-orange-700"
          />
        }
      >
        {children}
      </DialogTrigger>

      <DialogContent className="p-8 pt-4 sm:max-w-4xl">
        <DialogTitle className="text-xl font-bold">
          Choose Your Essora Plan
        </DialogTitle>

        <PricingSection />
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;
