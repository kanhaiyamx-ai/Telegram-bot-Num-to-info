// Storage module with caching and rate limiting
// Optimized for serverless - persists across warm invocations

const { CACHE_DURATION, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } = require('./config');

// ==================== USER STORAGE ====================

const users = {};
const bannedUsers = new Set();

function addUser(userId, username) {
  const id = String(userId);
  if (!users[id]) {
    users[id] = {
      id: userId,
      username: username || 'Unknown',
      joinedAt: new Date().toISOString()
    };
  }
}

function getAllUsers() {
  return users;
}

function getTotalUsers() {
  return Object.keys(users).length;
}

function banUser(userId) {
  bannedUsers.add(String(userId));
}

function unbanUser(userId) {
  bannedUsers.delete(String(userId));
}

function isBanned(userId) {
  return bannedUsers.has(String(userId));
}

// ==================== LOOKUP CACHE ====================

const lookupCache = new Map();

function getCached(number) {
  const item = lookupCache.get(number);
  if (!item) return null;
  
  // Check if expired
  if (Date.now() - item.time > CACHE_DURATION) {
    lookupCache.delete(number);
    return null;
  }
  
  return item.data;
}

function setCache(number, data) {
  lookupCache.set(number, {
    data: data,
    time: Date.now()
  });
  
  // Cleanup old entries (keep cache small)
  if (lookupCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of lookupCache) {
      if (now - value.time > CACHE_DURATION) {
        lookupCache.delete(key);
      }
    }
  }
}

function getCacheStats() {
  return {
    size: lookupCache.size,
    maxAge: CACHE_DURATION / 1000 + 's'
  };
}

// ==================== RATE LIMITING ====================

const rateLimits = new Map();

function checkRateLimit(userId) {
  const id = String(userId);
  const now = Date.now();
  
  // Cleanup old entries occasionally
  if (rateLimits.size > 100) {
    cleanupRateLimits();
  }
  
  let userLimit = rateLimits.get(id);
  
  if (!userLimit) {
    userLimit = { count: 0, windowStart: now };
    rateLimits.set(id, userLimit);
  }
  
  // Reset window if expired
  if (now - userLimit.windowStart > RATE_LIMIT_WINDOW) {
    userLimit.count = 0;
    userLimit.windowStart = now;
  }
  
  // Check if over limit
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false; // Rate limited
  }
  
  // Increment counter
  userLimit.count++;
  return true; // Allowed
}

function getRateLimitRemaining(userId) {
  const id = String(userId);
  const userLimit = rateLimits.get(id);
  
  if (!userLimit) return RATE_LIMIT_MAX;
  
  const now = Date.now();
  if (now - userLimit.windowStart > RATE_LIMIT_WINDOW) {
    return RATE_LIMIT_MAX;
  }
  
  return Math.max(0, RATE_LIMIT_MAX - userLimit.count);
}

// Cleanup old rate limit entries (runs on each check, not interval)
function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of rateLimits) {
    if (now - value.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimits.delete(key);
    }
  }
}

module.exports = {
  // User storage
  addUser,
  getAllUsers,
  getTotalUsers,
  banUser,
  unbanUser,
  isBanned,
  
  // Cache
  getCached,
  setCache,
  getCacheStats,
  
  // Rate limiting
  checkRateLimit,
  getRateLimitRemaining
};
