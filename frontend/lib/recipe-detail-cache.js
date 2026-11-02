const CACHE_TTL = 10 * 60 * 1000;
const MAX_ENTRIES = 200;
const recipeCache = new Map();
const inFlightRequests = new Map();

function isFresh(entry) {
  return entry && Date.now() - entry.savedAt < CACHE_TTL;
}

export function getRecipeDetailCache(key) {
  const entry = recipeCache.get(key);

  if (!isFresh(entry)) {
    recipeCache.delete(key);
    return null;
  }

  return entry.data;
}

export function setRecipeDetailCache(key, data) {
  recipeCache.delete(key);
  recipeCache.set(key, { data, savedAt: Date.now() });

  while (recipeCache.size > MAX_ENTRIES) {
    recipeCache.delete(recipeCache.keys().next().value);
  }
}

export function getRecipeDetailInFlight(key) {
  return inFlightRequests.get(key);
}

export function setRecipeDetailInFlight(key, promise) {
  inFlightRequests.set(key, promise);
}

export function clearRecipeDetailInFlight(key, promise) {
  if (inFlightRequests.get(key) === promise) {
    inFlightRequests.delete(key);
  }
}

export function invalidateRecipeDetailCache(predicate = () => true) {
  for (const key of recipeCache.keys()) {
    if (predicate(key)) recipeCache.delete(key);
  }
}
