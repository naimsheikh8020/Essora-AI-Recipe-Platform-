"use server";

import { checkUser } from "@/lib/checkUser";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { freePantryScans, proTierLimit } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { randomUUID } from "node:crypto";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const createPantryRequestId = () => randomUUID();

// Scan image with Gemini Vision
export async function scanPantryImage(formData) {
  const startedAt = performance.now();
  const requestId = createPantryRequestId();
  try {
    let stageStartedAt = performance.now();
    const user = await checkUser(requestId);
    const userLookupDuration = performance.now() - stageStartedAt;
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user is Pro
    const isPro = user.subscriptionTier === "pro";

    // Apply Arcjet rate limit based on tier
    const arcjetClient = isPro ? proTierLimit : freePantryScans;

    // Create a request object for Arcjet
    const req = await request();

    const decision = await arcjetClient.protect(req, {
      userId: user.clerkId, // Use clerkId from checkUser
      requested: 1, // Request 1 token from bucket
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw new Error(
          `Monthly scan limit reached. ${isPro
            ? "Please contact support if you need more scans."
            : "Upgrade to Pro for unlimited scans!"
          }`
        );
      }
      throw new Error("Request denied by security system");
    }

    const imageFile = formData.get("image");
    if (!imageFile) {
      throw new Error("No image provided");
    }

    // Convert image to base64
    stageStartedAt = performance.now();
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const imagePreparationDuration = performance.now() - stageStartedAt;

    // Call Gemini Vision API
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    const prompt = `
You are a professional chef and ingredient recognition expert. Analyze this image of a pantry/fridge and identify all visible food ingredients.

Return ONLY a valid JSON array with this exact structure (no markdown, no explanations):
[
  {
    "name": "ingredient name",
    "quantity": "estimated quantity with unit",
    "confidence": 0.95
  }
]

Rules:
- Only identify food ingredients (not containers, utensils, or packaging)
- Be specific (e.g., "Cheddar Cheese" not just "Cheese")
- Estimate realistic quantities (e.g., "3 eggs", "1 cup milk", "2 tomatoes")
- Confidence should be 0.7-1.0 (omit items below 0.7)
- Maximum 20 items
- Common pantry staples are acceptable (salt, pepper, oil)
`;

    stageStartedAt = performance.now();
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image,
        },
      },
    ]);
    const modelDuration = performance.now() - stageStartedAt;

    stageStartedAt = performance.now();
    const response = await result.response;
    const text = response.text();
    const responseReadDuration = performance.now() - stageStartedAt;

    // Parse JSON response
    let ingredients;
    try {
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      ingredients = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Failed to parse ingredients. Please try again.");
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new Error(
        "No ingredients detected in the image. Please try a clearer photo."
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.info(
        `[scanPantryImage] total=${Math.round(performance.now() - startedAt)}ms ` +
          `userLookup=${Math.round(userLookupDuration)}ms ` +
          `imagePreparation=${Math.round(imagePreparationDuration)}ms ` +
          `model=${Math.round(modelDuration)}ms ` +
          `responseRead=${Math.round(responseReadDuration)}ms ` +
          `ingredients=${ingredients.length}`
      );
    }

    return {
      success: true,
      ingredients: ingredients.slice(0, 20),
      scansLimit: isPro ? "unlimited" : 10,
      message: `Found ${ingredients.length} ingredients!`,
    };
  } catch (error) {
    console.error("Error scanning pantry:", error);
    throw new Error(error.message || "Failed to scan image");
  }
}

// Save ingredients to pantry
export async function saveToPantry(formData) {
  const startedAt = performance.now();
  const requestId = createPantryRequestId();
  try {
    const authStartedAt = performance.now();
    const user = await checkUser(requestId);
    const authDuration = performance.now() - authStartedAt;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const ingredientsJson = formData.get("ingredients");
    let ingredients;
    try {
      ingredients = JSON.parse(ingredientsJson);
    } catch {
      throw new Error("Invalid ingredients payload");
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new Error("No ingredients to save");
    }

    const requestStartedAt = performance.now();
    const response = await fetch(`${STRAPI_URL}/api/pantry-items/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Essora-Request-Id": requestId,
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        ownerId: user.id,
        ingredients: ingredients.map(({ name, quantity }) => ({ name, quantity })),
      }),
    });
    const requestDuration = performance.now() - requestStartedAt;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to save pantry items:", errorText);
      throw new Error("Failed to save items");
    }

    const parseStartedAt = performance.now();
    const data = await response.json();
    const parseDuration = performance.now() - parseStartedAt;
    const savedCount = data.data?.count || 0;
    const savedItems = data.data?.items || [];
    const ownerIds = savedItems.map((item) => item.owner?.id);
    const expectedOwnerId = Number(user.id);

    if (
      savedCount !== ingredients.length ||
      savedItems.length !== ingredients.length ||
      ownerIds.some((ownerId) => ownerId !== expectedOwnerId)
    ) {
      console.error("Pantry bulk save returned an incomplete result:", {
        requested: ingredients.length,
        savedCount,
        returnedItems: savedItems.length,
        ownerIds,
      });
      throw new Error("Pantry items were not persisted correctly");
    }

    if (process.env.NODE_ENV === "development") {
      console.info(
        `[saveToPantry] requestId=${requestId} total=${Math.round(performance.now() - startedAt)}ms ` +
          `auth=${Math.round(authDuration)}ms ` +
          `strapiRequest=${Math.round(requestDuration)}ms ` +
          `responseJson=${Math.round(parseDuration)}ms ` +
          `requested=${ingredients.length} persisted=${savedCount} ` +
          `returned=${savedItems.length} ownerIds=${ownerIds.join(",")}`
      );
    }

    return {
      success: true,
      savedItems,
      message: `Saved ${savedCount} items to your pantry!`,
    };
  } catch (error) {
    console.error("Error saving to pantry:", error);
    throw new Error(error.message || "Failed to save items");
  }
}

// Add pantry item manually
export async function addPantryItemManually(formData) {
  const requestId = createPantryRequestId();
  try {
    const user = await checkUser(requestId);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const name = formData.get("name");
    const quantity = formData.get("quantity");

    if (!name || !quantity) {
      throw new Error("Name and quantity are required");
    }

    const response = await fetch(`${STRAPI_URL}/api/pantry-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Essora-Request-Id": requestId,
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          name: name.trim(),
          quantity: quantity.trim(),
          imageUrl: "",
          owner: user.id,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to add item:", errorText);
      throw new Error("Failed to add item to pantry");
    }

    const data = await response.json();

    return {
      success: true,
      item: data.data,
      message: "Item added successfully!",
    };
  } catch (error) {
    console.error("Error adding item manually:", error);
    throw new Error(error.message || "Failed to add item");
  }
}

// Get user's pantry items
export async function getPantryItems() {
  const startedAt = performance.now();
  const requestId = createPantryRequestId();
  try {
    const authStartedAt = performance.now();
    const { userId: clerkUserId, has } = await auth();
    if (!clerkUserId) {
      throw new Error("User not authenticated");
    }

    const subscriptionTier = has({ plan: "pro" }) ? "pro" : "free";
    const authDuration = performance.now() - authStartedAt;
    const requestStartedAt = performance.now();
    let strapiRequestDuration;
    const response = await fetch(
      `${STRAPI_URL}/api/pantry-items-owner?clerkId=${encodeURIComponent(clerkUserId)}`,
      {
        headers: {
          "X-Essora-Request-Id": requestId,
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );
    strapiRequestDuration = performance.now() - requestStartedAt;

    let data;
    let responseJsonStartedAt = performance.now();
    if (response.status === 404) {
      const user = await checkUser(requestId);
      if (!user) {
        throw new Error("User is not registered");
      }

      const fallbackResponse = await fetch(
        `${STRAPI_URL}/api/pantry-items-owner?ownerId=${encodeURIComponent(user.id)}`,
        {
          headers: {
            "X-Essora-Request-Id": requestId,
            Authorization: `******`,
          },
          cache: "no-store",
        }
      );
      strapiRequestDuration = performance.now() - requestStartedAt;

      if (!fallbackResponse.ok) {
        throw new Error("Failed to fetch pantry items");
      }

      responseJsonStartedAt = performance.now();
      data = await fallbackResponse.json();
    } else if (!response.ok) {
      throw new Error("Failed to fetch pantry items");
    } else {
      responseJsonStartedAt = performance.now();
      data = await response.json();
    }
    const responseJsonDuration = performance.now() - responseJsonStartedAt;

    if (process.env.NODE_ENV === "development") {
      console.info(
        `[getPantryItems] requestId=${requestId} total=${Math.round(performance.now() - startedAt)}ms ` +
          `auth=${Math.round(authDuration)}ms ` +
        `strapiRequest=${Math.round(strapiRequestDuration)}ms ` +
          `responseJson=${Math.round(responseJsonDuration)}ms ` +
          `userId=${clerkUserId} returned=${data.data?.length || 0}`
      );
    }

    return {
      success: true,
      items: data.data || [],
      scansLimit: subscriptionTier === "pro" ? "unlimited" : 10,
    };
  } catch (error) {
    console.error("Error fetching pantry:", error);
    throw new Error(error.message || "Failed to load pantry");
  }
}

// Delete pantry item
export async function deletePantryItem(formData) {
  const startedAt = performance.now();
  const requestId = createPantryRequestId();
  try {
    const user = await checkUser(requestId);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const itemId = formData.get("itemId");

    const response = await fetch(
      `${STRAPI_URL}/api/pantry-items/owned/${itemId}?ownerId=${encodeURIComponent(user.id)}`,
      {
        method: "DELETE",
      headers: {
        "X-Essora-Request-Id": requestId,
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete item");
    }

    if (process.env.NODE_ENV === "development") {
      console.info(
        `[deletePantryItem] requestId=${requestId} total=${Math.round(performance.now() - startedAt)}ms ` +
          `status=${response.status} itemCount=1`
      );
    }

    return {
      success: true,
      message: "Item removed from pantry",
    };
  } catch (error) {
    console.error("Error deleting item:", error);
    throw new Error(error.message || "Failed to delete item");
  }
}

// Delete multiple pantry items
export async function deletePantryItems(formData) {
  const startedAt = performance.now();
  const requestId = createPantryRequestId();
  try {
    const user = await checkUser(requestId);
    if (!user) {
      throw new Error("User not authenticated");
    }

    let itemIds;
    try {
      itemIds = JSON.parse(formData.get("itemIds"));
    } catch {
      throw new Error("Invalid item IDs payload");
    }

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new Error("No pantry items selected");
    }

    const endpoint = `${STRAPI_URL.replace(/\/$/, "")}/api/pantry-items/bulk-delete`;
    const apiToken = STRAPI_API_TOKEN?.trim();
    const requestStartedAt = performance.now();
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Essora-Request-Id": requestId,
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        ownerId: user.id,
        itemIds,
      }),
    });
    const requestDuration = performance.now() - requestStartedAt;

    if (!response.ok) {
      const errorText = await response.text();
      if (process.env.NODE_ENV === "development") {
        console.error(
          `[deletePantryItems] method=POST endpoint=${endpoint} ` +
            `status=${response.status} tokenConfigured=${Boolean(apiToken)} ` +
            `response=${errorText}`
        );
      }
      if (response.status === 403) {
        throw new Error(
          "Bulk delete was rejected by Strapi. Restart Strapi and Next.js after enabling the bulkDelete API-token permission."
        );
      }
      throw new Error("Failed to delete pantry items");
    }

    if (process.env.NODE_ENV === "development") {
      console.info(
        `[deletePantryItems] method=POST endpoint=${endpoint} ` +
          `status=${response.status} tokenConfigured=${Boolean(apiToken)}`
      );
    }

    const parseStartedAt = performance.now();
    const data = await response.json();
    const parseDuration = performance.now() - parseStartedAt;
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[deletePantryItems] requestId=${requestId} total=${Math.round(performance.now() - startedAt)}ms ` +
          `authAndValidation=${Math.round(requestStartedAt - startedAt)}ms ` +
          `http=${Math.round(requestDuration)}ms responseJson=${Math.round(parseDuration)}ms ` +
          `status=${response.status} itemCount=${itemIds.length}`
      );
    }
    return {
      success: true,
      count: data.data?.count || 0,
      message: `Removed ${data.data?.count || 0} items from your pantry`,
    };
  } catch (error) {
    console.error("Error deleting pantry items:", error);
    throw new Error(error.message || "Failed to delete pantry items");
  }
}

// Update pantry item
export async function updatePantryItem(formData) {
  const startedAt = performance.now();
  const requestId = createPantryRequestId();
  try {
    const user = await checkUser(requestId);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const itemId = formData.get("itemId");
    const name = formData.get("name");
    const quantity = formData.get("quantity");

    const requestStartedAt = performance.now();
    const response = await fetch(`${STRAPI_URL}/api/pantry-items/owned/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Essora-Request-Id": requestId,
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        ownerId: user.id,
        name,
        quantity,
      }),
    });
    const requestDuration = performance.now() - requestStartedAt;

    if (!response.ok) {
      throw new Error("Failed to update item");
    }

    const data = await response.json();
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[updatePantryItem] requestId=${requestId} total=${Math.round(performance.now() - startedAt)}ms ` +
          `http=${Math.round(requestDuration)}ms status=${response.status} itemCount=1`
      );
    }

    return {
      success: true,
      item: data.data,
      message: "Item updated successfully",
    };
  } catch (error) {
    console.error("Error updating item:", error);
    throw new Error(error.message || "Failed to update item");
  }
}