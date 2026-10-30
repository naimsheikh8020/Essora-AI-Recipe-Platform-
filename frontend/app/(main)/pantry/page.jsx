/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ChefHat,
  Loader2,
  Package,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/use-fetch";
import {
  getPantryItems,
  deletePantryItem,
  deletePantryItems,
  updatePantryItem,
} from "@/actions/pantry.actions";
import { toast } from "sonner";
import AddToPantryModal from "@/components/AddToPantryModal";
import PricingModal from "@/components/PricingModal";

export default function PantryPage() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ name: "", quantity: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch pantry items
  const {
    loading: loadingItems,
    data: itemsData,
    fn: fetchItems,
  } = useFetch(getPantryItems);

  // Delete item
  const {
    loading: deleting,
    data: deleteData,
    fn: deleteItem,
  } = useFetch(deletePantryItem);

  const {
    loading: deletingBulk,
    data: bulkDeleteData,
    fn: deleteSelectedItems,
  } = useFetch(deletePantryItems);

  // Update item
  const {
    loading: updating,
    data: updateData,
    fn: updateItem,
  } = useFetch(updatePantryItem);

  // Load items on mount
  useEffect(() => {
    fetchItems();
  }, []);

  // Update items when data arrives
  useEffect(() => {
    if (itemsData?.success) {
      setItems(itemsData.items);
    }
  }, [itemsData]);

  // Refresh after delete
  useEffect(() => {
    if (deleteData?.success && !deleting) {
      toast.success("Item removed from pantry");
      setSelectedIds((ids) => ids.filter((id) => id !== deletingId));
      fetchItems();
    }
  }, [deleteData]);

  useEffect(() => {
    if (bulkDeleteData?.success && !deletingBulk) {
      toast.success(bulkDeleteData.message);
      setSelectedIds([]);
      fetchItems();
    }
  }, [bulkDeleteData]);

  // Refresh after update
  useEffect(() => {
    if (updateData?.success) {
      toast.success("Item updated successfully");
      setEditingId(null);
      fetchItems();
    }
  }, [updateData]);

  // Handle delete
  const handleDelete = async (itemId) => {
    setDeletingId(itemId);
    const formData = new FormData();
    formData.append("itemId", itemId);
    const result = await deleteItem(formData);
    if (result?.success) {
      setSelectedIds((ids) => ids.filter((id) => id !== itemId));
    }
    setDeletingId(null);
  };

  const toggleSelected = (itemId) => {
    setSelectedIds((ids) =>
      ids.includes(itemId)
        ? ids.filter((id) => id !== itemId)
        : [...ids, itemId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const formData = new FormData();
    formData.append("itemIds", JSON.stringify(selectedIds));
    await deleteSelectedItems(formData);
  };

  // Start editing
  const startEdit = (item) => {
    setEditingId(item.documentId);
    setEditValues({
      name: item.name,
      quantity: item.quantity,
    });
  };

  // Save edit
  const saveEdit = async () => {
    const formData = new FormData();
    formData.append("itemId", editingId);
    formData.append("name", editValues.name);
    formData.append("quantity", editValues.quantity);
    await updateItem(formData);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ name: "", quantity: "" });
  };

  // Handle modal success (refresh items)
  const handleModalSuccess = () => {
    fetchItems();
  };

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <header className="mb-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700">
                <Package className="h-4 w-4" />
                Your personal kitchen
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
                My Pantry<span className="text-orange-600">.</span>
              </h1>

              <p className="mt-3 max-w-xl text-base leading-7 text-stone-500">
                Everything you have, all in one place. Manage your ingredients
                and discover something delicious to cook.
              </p>
            </div>

            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-12 rounded-xl bg-orange-600 px-6 font-semibold text-white shadow-sm transition hover:bg-orange-700 sm:w-auto cursor-pointer"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add ingredients
            </Button>
          </div>

          {/* Pantry Summary */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
                <Package className="h-6 w-6 text-orange-600" />
              </div>

              <div>
                <p className="text-sm text-stone-500">Total ingredients</p>
                <p className="mt-1 text-2xl font-bold text-stone-900">
                  {items.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-stone-500">AI pantry scans</p>

                {itemsData?.scansLimit === "unlimited" ? (
                  <p className="mt-1 font-semibold text-emerald-700">
                    Unlimited scans
                  </p>
                ) :
                  (
                    <PricingModal>
                      <span
                        role="button"
                        tabIndex={0}
                        className="mt-1 cursor-pointer text-left font-semibold text-orange-600 transition hover:text-orange-700"
                      >
                        Upgrade to Pro
                        <span className="ml-1 text-sm font-normal text-stone-500">
                          · Unlimited scans
                        </span>
                      </span>
                    </PricingModal>

                  )}
              </div>
            </div>
          </div>
        </header>

        {/* Find Recipes Banner */}
        {items.length > 0 && (
          <Link href="/pantry/recipes" className="group mb-10 block">
            <div className="relative overflow-hidden rounded-2xl bg-stone-900 p-6 text-white shadow-sm transition duration-300 hover:shadow-lg sm:p-8">
              <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl transition group-hover:bg-orange-500/30" />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500">
                    <ChefHat className="h-7 w-7" />
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-medium text-orange-300">
                      YOUR NEXT MEAL STARTS HERE
                    </p>

                    <h2 className="text-xl font-bold sm:text-2xl">
                      What can you cook today?
                    </h2>

                    <p className="mt-2 max-w-lg text-sm leading-6 text-stone-300">
                      Get AI-powered recipe suggestions using your{" "}
                      {items.length} pantry{" "}
                      {items.length === 1 ? "ingredient" : "ingredients"}.
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-start rounded-xl bg-white px-5 py-3 font-semibold text-stone-900 transition group-hover:bg-orange-50 sm:self-center">
                  Find recipes
                  <span className="text-lg transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Ingredients Section */}
        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 sm:text-2xl">
                Your ingredients
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Manage what's available in your kitchen.
              </p>
            </div>

            {items.length > 0 && (
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={deletingBulk || deletingId !== null}
                  >
                    {deletingBulk && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Delete {selectedIds.length}
                  </Button>
                )}
                <Badge className="rounded-full border border-stone-200 bg-white px-3 py-1 text-stone-700 hover:bg-white">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </Badge>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loadingItems && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                <div
                  key={skeleton}
                  className="animate-pulse rounded-2xl border border-stone-200 bg-white p-5"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-stone-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-stone-100" />
                      <div className="h-3 w-1/3 rounded bg-stone-100" />
                    </div>
                  </div>

                  <div className="h-3 w-1/2 rounded bg-stone-100" />
                </div>
              ))}
            </div>
          )}

          {/* Ingredient Cards */}
          {!loadingItems && items.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.documentId}
                  className="group rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <label className="mb-3 flex items-center gap-2 text-xs text-stone-500">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.documentId)}
                      onChange={() => toggleSelected(item.documentId)}
                      disabled={deletingBulk || deletingId !== null}
                      aria-label={`Select ${item.name}`}
                      className="h-4 w-4 rounded border-stone-300 accent-orange-600"
                    />
                    Select item
                  </label>
                  {editingId === item.documentId ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor={`name-${item.documentId}`}
                          className="mb-2 block text-sm font-medium text-stone-700"
                        >
                          Ingredient name
                        </label>

                        <input
                          id={`name-${item.documentId}`}
                          type="text"
                          value={editValues.name}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              name: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                          placeholder="Ingredient name"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`quantity-${item.documentId}`}
                          className="mb-2 block text-sm font-medium text-stone-700"
                        >
                          Quantity
                        </label>

                        <input
                          id={`quantity-${item.documentId}`}
                          type="text"
                          value={editValues.quantity}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              quantity: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                          placeholder="e.g. 500g"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={saveEdit}
                          disabled={updating}
                          className="flex-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          {updating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="mr-1 h-4 w-4" />
                              Save changes
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={updating}
                          className="rounded-lg border-stone-200"
                          aria-label="Cancel editing"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <>
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-100">
                            <Package className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="break-words font-semibold text-stone-900">
                              {item.name}
                            </h3>

                            <p className="mt-1 text-sm text-stone-500">
                              {item.quantity}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-orange-50 hover:text-orange-600"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.documentId)}
                            disabled={deletingId !== null || deletingBulk}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Delete ${item.name}`}
                          >
                            {deletingId === item.documentId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-stone-100 pt-3">
                        <p className="text-xs text-stone-400">
                          Added{" "}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingItems && items.length === 0 && (
            <div className="rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm sm:px-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50">
                <Package className="h-9 w-9 text-orange-600" />
              </div>

              <h3 className="mt-6 text-2xl font-bold tracking-tight text-stone-900">
                Your pantry is waiting.
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-500">
                Add your first ingredients manually or let AI identify
                ingredients from a photo. Your next great meal starts here.
              </p>

              <Button
                onClick={() => setIsModalOpen(true)}
                className="mt-7 h-12 rounded-xl bg-orange-600 px-6 font-semibold text-white hover:bg-orange-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add your first ingredients
              </Button>
            </div>
          )}
        </section>

        {/* Add to Pantry Modal */}
        <AddToPantryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      </div>
    </main>
  );
}