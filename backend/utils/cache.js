// backend/src/utils/cache.js
const cache = new Map();

export const getCached = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
};

export const setCache = (key, value, ttl = 3600000) => {
  cache.set(key, {
    value,
    expiry: Date.now() + ttl
  });
};