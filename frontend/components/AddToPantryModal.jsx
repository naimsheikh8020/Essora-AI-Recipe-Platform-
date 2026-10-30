/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { Camera, Plus, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "@/components/ImageUploader";
import useFetch from "@/hooks/use-fetch";

import { toast } from "sonner";
import { addPantryItemManually, saveToPantry, scanPantryImage } from "@/actions/pantry.actions";

export default function AddToPantryModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState("scan");
  const [selectedImage, setSelectedImage] = useState(null);
  const [scannedIngredients, setScannedIngredients] = useState([]);
  const [manualItem, setManualItem] = useState({ name: "", quantity: "" });

  // Scan image
  const {
    loading: scanning,
    data: scanData,
    fn: scanImage,
  } = useFetch(scanPantryImage);

  // Save scanned items
  const {
    loading: saving,
    fn: saveScannedItems,
  } = useFetch(saveToPantry);

  // Add manual item
  const {
    loading: adding,
    fn: addManualItem,
  } = useFetch(addPantryItemManually);

  // Handle image selection
  const handleImageSelect = (file) => {
    setSelectedImage(file);
    setScannedIngredients([]); // Reset when new image selected
  };

  // Scan image
  const handleScan = async () => {
    if (!selectedImage) return;
    const formData = new FormData();
    formData.append("image", selectedImage);
    await scanImage(formData);
  };

  // Update scanned ingredients when scan completes
  useEffect(() => {
    if (scanData?.success && scanData?.ingredients) {
      setScannedIngredients(scanData.ingredients);
      toast.success(`Found ${scanData.ingredients.length} ingredients!`);
    }
  }, [scanData]);

  // Handle save scanned items
  const handleSaveScanned = async () => {
    if (scannedIngredients.length === 0) {
      toast.error("No ingredients to save");
      return;
    }

    const formData = new FormData();
    formData.append("ingredients", JSON.stringify(scannedIngredients));
    const result = await saveScannedItems(formData);

    if (result?.success) {
      toast.success(result.message);
      handleClose();
      onSuccess?.(result.savedItems);
    }
  };

  // Reset modal state
  const handleClose = () => {
    setActiveTab("scan");
    setSelectedImage(null);
    setScannedIngredients([]);
    setManualItem({ name: "", quantity: "" });
    onClose();
  };

  // Handle manual add
  const handleAddManual = async (e) => {
    e.preventDefault();
    if (!manualItem.name.trim() || !manualItem.quantity.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", manualItem.name);
    formData.append("quantity", manualItem.quantity);
    const result = await addManualItem(formData);

    if (result?.success) {
      toast.success("Item added to pantry!");
      setManualItem({ name: "", quantity: "" });
      handleClose();
      onSuccess?.(result.item ? [result.item] : []);
    }
  };

  // Remove scanned ingredient
  const removeIngredient = (index) => {
    setScannedIngredients(scannedIngredients.filter((_, i) => i !== index));
  };

  useEffect(() => {
  if (!isOpen) return;

  const scrollY = window.scrollY;
  const body = document.body;

  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";

  return () => {
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";

    window.scrollTo(0, scrollY);
  };
}, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent  className="flex max-h-[85dvh] w-[calc(100%-24px)] max-w-md flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-xl font-bold text-stone-900">
            Add to your pantry
          </DialogTitle>
          <DialogDescription className="text-sm text-stone-500">
            Scan ingredients with AI or add them manually.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}  className="mt-3 flex min-h-0 flex-1 flex-col">
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl bg-stone-100 p-1">
            <TabsTrigger value="scan" className="gap-2 rounded-lg">
              <Camera className="h-4 w-4" />
              AI Scan
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2 rounded-lg">
              <Plus className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-4 space-y-4">
            {scannedIngredients.length === 0 ? (
              <>
                <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3">
                  <p className="text-sm font-medium text-stone-800">
                    Let AI identify your ingredients
                  </p>
                  <p className="mt-1 text-xs leading-5 text-stone-600">
                    Upload a clear photo of your ingredients to get started.
                  </p>
                </div>

                <ImageUploader
                  onImageSelect={handleImageSelect}
                  loading={scanning}
                />

                {selectedImage && (
                  <Button
                    onClick={handleScan}
                    disabled={scanning}
                    className="h-11 w-full rounded-xl bg-orange-600 text-white hover:bg-orange-700"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Identifying...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Identify ingredients
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-stone-900">
                      Detected ingredients
                    </h3>
                    <p className="text-xs text-stone-500">
                      {scannedIngredients.length} items found
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setScannedIngredients([]);
                      setSelectedImage(null);
                    }}
                    className="rounded-lg"
                  >
                    <Camera className="mr-1 h-4 w-4" />
                    Rescan
                  </Button>
                </div>

                <div className="max-h-56 space-y-2 overflow-y-auto overscroll-contain">
                  {scannedIngredients.map((ingredient, index) => (
                    <div
                      key={`${ingredient.name}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-stone-200 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-900">
                          {ingredient.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {ingredient.quantity}
                        </p>
                      </div>

                      {ingredient.confidence != null && (
                        <Badge variant="outline" className="text-green-700">
                          {Math.round(ingredient.confidence * 100)}%
                        </Badge>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeIngredient(index)}
                        aria-label={`Remove ${ingredient.name}`}
                        className="h-8 w-8 shrink-0 text-stone-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleSaveScanned}
                  disabled={saving || scannedIngredients.length === 0}
                  className="h-11 w-full rounded-xl bg-orange-600 text-white hover:bg-orange-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save {scannedIngredients.length} ingredients
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleAddManual} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">
                  Ingredient name
                </label>
                <input
                  type="text"
                  value={manualItem.name}
                  onChange={(e) =>
                    setManualItem({ ...manualItem, name: e.target.value })
                  }
                  placeholder="e.g. Chicken breast"
                  className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  disabled={adding}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">
                  Quantity
                </label>
                <input
                  type="text"
                  value={manualItem.quantity}
                  onChange={(e) =>
                    setManualItem({ ...manualItem, quantity: e.target.value })
                  }
                  placeholder="e.g. 500g, 2 pieces"
                  className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  disabled={adding}
                />
              </div>

              <Button
                type="submit"
                disabled={adding}
                className="h-11 w-full rounded-xl bg-orange-600 text-white hover:bg-orange-700"
              >
                {adding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add to pantry
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}