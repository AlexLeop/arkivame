import { LRUCache } from 'lru-cache';

// Configure the cache to store rate limit data
const rateLimitCache = new LRUCache<string, { count: number; resetTime: number }>({
  max: 1000, // Max 1000 unique IPs
  ttl: 1000 * 60 * 15, // 15 minutes
});

// Create a rate limiter that allows 5 requests per minute per IP
export const invitationRateLimiter = {
  check: (ip: string, limit = 5, windowMs = 60 * 1000) => {
    const now = Date.now();
    const cacheKey = `invite:${ip}`;
    
    const cached = rateLimitCache.get(cacheKey) || { count: 0, resetTime: now + windowMs };
    
    // Reset the counter if the window has passed
    if (now > cached.resetTime) {
      cached.count = 0;
      cached.resetTime = now + windowMs;
    }
    
    // Increment the counter
    cached.count += 1;
    
    // Update the cache
    rateLimitCache.set(cacheKey, cached);
    
    return {
      isAllowed: cached.count <= limit,
      remaining: Math.max(0, limit - cached.count),
      reset: cached.resetTime,
    };
  },
};

// Helper function to check rate limit
export const checkRateLimit = (ip: string, limit: number, windowMs: number) => {
  return invitationRateLimiter.check(ip, limit, windowMs);
};
