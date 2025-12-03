const { setTimeout: wait } = require("timers/promises");

class TokenManager {
  constructor(redisClient) {
    this.redis = redisClient;
    // In-memory fallback cache when Redis is unavailable
    this.memoryCache = new Map();
    this.locks = new Map();
  }

  // Check if Redis is ready
  async isRedisReady() {
    if (!this.redis) return false;
    try {
      return this.redis.isReady;
    } catch {
      return false;
    }
  }

  // getToken ensures only one fetch is performed concurrently per vendor
  // fetchFn: async function that returns { access_token, expires_in }
  async getToken(vendorId, fetchFn, opts = {}) {
    const key = `vendor:${vendorId}:token`;
    const lockKey = `lock:vendor:${vendorId}:token`;
    const ttlField = opts.ttlField || "expires_in";
    const useRedis = await this.isRedisReady();

    // Try cache (Redis or memory)
    if (useRedis) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.access_token) return parsed.access_token;
        }
      } catch (err) {
        console.warn('Redis get error:', err.message);
      }
    } else {
      // Use memory cache
      const memCached = this.memoryCache.get(key);
      if (memCached && memCached.expiry > Date.now()) {
        return memCached.access_token;
      }
    }

    // Try to acquire lock
    if (useRedis) {
      try {
        const lock = await this.redis.set(lockKey, "1", { NX: true, PX: 15000 });
        if (lock) {
          try {
            const tokenResp = await fetchFn();
            const ttl = Math.max(10, (tokenResp[ttlField] || 3600) - 10);
            await this.redis.set(key, JSON.stringify(tokenResp), { EX: ttl });
            return tokenResp.access_token;
          } finally {
            try { await this.redis.del(lockKey); } catch(e){}
          }
        }

        // If lock not acquired, wait and retry reading from cache
        for (let i = 0; i < 10; i++) {
          await wait(300);
          const cached2 = await this.redis.get(key);
          if (cached2) {
            try { return JSON.parse(cached2).access_token; } catch(e){}
          }
        }
      } catch (err) {
        console.warn('Redis lock error:', err.message);
        // Fall through to memory-based fetch
      }
    }

    // Memory-based locking (for fallback)
    if (this.locks.has(vendorId)) {
      // Wait for existing fetch
      await this.locks.get(vendorId);
      const memCached = this.memoryCache.get(key);
      if (memCached && memCached.expiry > Date.now()) {
        return memCached.access_token;
      }
    }

    // Perform fetch with memory lock
    const fetchPromise = (async () => {
      try {
        const tokenResp = await fetchFn();
        const ttl = Math.max(10, (tokenResp[ttlField] || 3600) - 10);
        const expiry = Date.now() + ttl * 1000;
        
        // Store in memory cache
        this.memoryCache.set(key, {
          access_token: tokenResp.access_token,
          expiry
        });

        // Try to store in Redis if available
        if (useRedis) {
          try {
            await this.redis.set(key, JSON.stringify(tokenResp), { EX: ttl });
          } catch (err) {
            console.warn('Redis set error (non-critical):', err.message);
          }
        }

        return tokenResp.access_token;
      } finally {
        this.locks.delete(vendorId);
      }
    })();

    this.locks.set(vendorId, fetchPromise);
    return fetchPromise;
  }
}

module.exports = TokenManager;
