import SystemSettings from "../models/systemSettings.model.js";

// In-memory cache (1-minute TTL) to avoid hitting DB on every attendance check
let cache = {};
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export const getSystemSetting = async (key, defaultValue = null) => {
  const now = Date.now();
  if (now - cacheTime < CACHE_TTL_MS && cache[key] !== undefined) {
    return cache[key];
  }
  // Refresh entire cache
  const all = await SystemSettings.find().lean();
  cache = {};
  all.forEach(s => { cache[s.key] = s.value; });
  cacheTime = now;
  return cache[key] !== undefined ? cache[key] : defaultValue;
};

export const clearSettingsCache = () => {
  cache = {};
  cacheTime = 0;
};
