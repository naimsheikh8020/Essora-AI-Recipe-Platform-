
const STRAPI_URL =
  process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL;

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const IMAGE_REQUEST_TIMEOUT = 8000;
const DEFAULT_RECIPE_IMAGE = "/pasta-dish.png";

const CACHE_ENDPOINT = "/api/recipe-image-caches";

function normalizeRecipeKey(title) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function strapiRequest(path, options = {}) {
  if (!STRAPI_URL || !STRAPI_API_TOKEN) {
    throw new Error("Missing Strapi environment variables");
  }

  return fetch(`${STRAPI_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });
}

function isUsableImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function getRequestSignal() {
  return AbortSignal.timeout(IMAGE_REQUEST_TIMEOUT);
}

async function findCachedImage(recipeKey) {
  const params = new URLSearchParams({
    "filters[recipeKey][$eq]": recipeKey,
    "pagination[pageSize]": "1",
  });

  const response = await strapiRequest(
    `${CACHE_ENDPOINT}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Image cache lookup failed: ${response.status}`);
  }

  const result = await response.json();

  return result.data?.[0] || null;
}


async function saveCachedImage(recipeName, recipeKey, image) {
  const response = await strapiRequest(CACHE_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      data: {
        recipeKey,
        recipeTitle: recipeName,
        imageUrl: image.imageUrl,
        photographerName: image.photographerName || "",
        photographerUrl: image.photographerUrl || "",
        unsplashPhotoId: image.imageId
          ? `${image.provider || "image"}:${image.imageId}`
          : "",
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    console.error("Strapi image cache creation failed:", {
      status: response.status,
      recipeName,
      recipeKey,
      response: errorBody,
    });

    // Check whether another request already created this entry.
    const existing = await findCachedImage(recipeKey).catch(() => null);

    if (existing?.imageUrl) {
      return existing.imageUrl;
    }

    throw new Error(
      `Image cache save failed: ${response.status} - ${errorBody}`
    );
  }

  const result = await response.json();

  return result.data?.imageUrl || image.imageUrl;
}

async function fetchUnsplashImage(recipeName) {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("Unsplash API key is missing");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        recipeName
      )}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
        signal: getRequestSignal(),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Unsplash error:", response.status);
      return null;
    }

    const data = await response.json();
    const photo = data.results?.[0];
    const imageUrl = photo?.urls?.regular;

    if (!isUsableImageUrl(imageUrl)) {
      console.warn("Unsplash returned no usable image:", recipeName);
      return null;
    }

    return {
      imageUrl,
      photographerName: photo.user?.name || "",
      photographerUrl: photo.user?.links?.html || "",
      provider: "unsplash",
      imageId: photo.id,
    };
  } catch (error) {
    console.error("Unsplash request failed:", error.message);
    return null;
  }
}

async function fetchPixabayImage(recipeName) {
  if (!PIXABAY_API_KEY) {
    console.warn("Pixabay API key is missing");
    return null;
  }

  try {
    const params = new URLSearchParams({
      key: PIXABAY_API_KEY,
      q: `${recipeName} food`,
      image_type: "photo",
      category: "food",
      orientation: "horizontal",
      safesearch: "true",
      per_page: "5",
    });
    const response = await fetch(
      `https://pixabay.com/api/?${params.toString()}`,
      {
        signal: getRequestSignal(),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Pixabay error:", response.status);
      return null;
    }

    const data = await response.json();
    const photo = data.hits?.[0];
    const imageUrl = photo?.largeImageURL || photo?.webformatURL;

    if (!isUsableImageUrl(imageUrl)) {
      console.warn("Pixabay returned no usable image:", recipeName);
      return null;
    }

    return {
      imageUrl,
      photographerName: photo.user || "",
      photographerUrl: photo.pageURL || "",
      provider: "pixabay",
      imageId: photo.id,
    };
  } catch (error) {
    console.error("Pixabay request failed:", error.message);
    return null;
  }
}

async function fetchPexelsImage(recipeName) {
  if (!PEXELS_API_KEY) {
    console.warn("Pexels API key is missing");
    return null;
  }

  try {
    const params = new URLSearchParams({
      query: `${recipeName} food`,
      per_page: "1",
      orientation: "landscape",
    });

    const response = await fetch(
      `https://api.pexels.com/v1/search?${params.toString()}`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
        signal: getRequestSignal(),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Pexels error:", response.status);
      return null;
    }

    const data = await response.json();
    const photo = data.photos?.[0];
    const imageUrl = photo?.src?.large || photo?.src?.medium;

    if (!isUsableImageUrl(imageUrl)) {
      console.warn("Pexels returned no usable image:", recipeName);
      return null;
    }

    return {
      imageUrl,
      photographerName: photo.photographer || "",
      photographerUrl: photo.photographer_url || "",
      provider: "pexels",
      imageId: photo.id,
    };
  } catch (error) {
    console.error("Pexels request failed:", error.message);
    return null;
  }
}

export async function fetchRecipeImage(recipeName) {
  if (!recipeName?.trim()) return DEFAULT_RECIPE_IMAGE;

  const recipeKey = normalizeRecipeKey(recipeName);

  try {
    let cachedImage = null;

    try {
      cachedImage = await findCachedImage(recipeKey);
    } catch (error) {
      console.error("Recipe image cache lookup failed:", error.message);
    }

    if (isUsableImageUrl(cachedImage?.imageUrl)) {
      console.log(`⚡ Image cache HIT: ${recipeName}`);
      return cachedImage.imageUrl;
    }

    console.log(`🔍 Image cache MISS: ${recipeName}`);

    const providers = [
      ["unsplash", fetchUnsplashImage],
      ["pixabay", fetchPixabayImage],
      ["pexels", fetchPexelsImage],
    ];

    for (const [provider, fetchImage] of providers) {
      const image = await fetchImage(recipeName);

      if (!image) continue;

      try {
        const imageUrl = await saveCachedImage(recipeName, recipeKey, image);
        console.log(`💾 Image cached via ${provider}: ${recipeName}`);
        return imageUrl;
      } catch (error) {
        console.error(`Failed to cache ${provider} image:`, error.message);
        return image.imageUrl;
      }
    }

    console.warn(`No image provider returned a usable image: ${recipeName}`);
    return DEFAULT_RECIPE_IMAGE;
  } catch (error) {
    console.error("Recipe image cache error:", error.message);
    return DEFAULT_RECIPE_IMAGE;
  }
}
