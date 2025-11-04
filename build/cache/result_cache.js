/**
 * Result Caching System for CTS MCP Tools
 *
 * Provides a generic LRU cache for expensive tool operations
 * with TTL support and cache statistics tracking.
 */
import crypto from 'crypto';
/**
 * LRU Cache with TTL support
 */
export class ResultCache {
    cache = new Map();
    accessOrder = [];
    stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
    };
    maxEntries;
    maxSize;
    ttl;
    enableStats;
    currentSize = 0;
    constructor(config = {}) {
        this.maxEntries = config.maxEntries ?? 100;
        this.maxSize = config.maxSize ?? 50 * 1024 * 1024; // 50MB
        this.ttl = config.ttl ?? 3600000; // 1 hour
        this.enableStats = config.enableStats ?? true;
    }
    /**
     * Generate cache key from parameters
     */
    generateKey(toolName, params) {
        const paramString = JSON.stringify(params, Object.keys(params).sort());
        const hash = crypto.createHash('sha256').update(toolName + paramString).digest('hex');
        return `${toolName}:${hash.substring(0, 16)}`;
    }
    /**
     * Estimate size of data in bytes
     */
    estimateSize(data) {
        const json = JSON.stringify(data);
        return Buffer.byteLength(json, 'utf8');
    }
    /**
     * Remove least recently used entry
     */
    evictLRU() {
        if (this.accessOrder.length === 0)
            return;
        const lruKey = this.accessOrder.shift();
        const entry = this.cache.get(lruKey);
        if (entry) {
            this.currentSize -= entry.size;
            this.cache.delete(lruKey);
            if (this.enableStats) {
                this.stats.evictions++;
            }
        }
    }
    /**
     * Check if entry is expired
     */
    isExpired(entry) {
        return Date.now() - entry.timestamp > this.ttl;
    }
    /**
     * Update access order for LRU
     */
    updateAccessOrder(key) {
        // Remove from current position
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
        // Add to end (most recently used)
        this.accessOrder.push(key);
    }
    /**
     * Get cached result
     */
    get(toolName, params) {
        const key = this.generateKey(toolName, params);
        const entry = this.cache.get(key);
        if (!entry) {
            if (this.enableStats) {
                this.stats.misses++;
            }
            return undefined;
        }
        // Check expiration
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.currentSize -= entry.size;
            const orderIndex = this.accessOrder.indexOf(key);
            if (orderIndex !== -1) {
                this.accessOrder.splice(orderIndex, 1);
            }
            if (this.enableStats) {
                this.stats.misses++;
            }
            return undefined;
        }
        // Update access order and hit count
        this.updateAccessOrder(key);
        entry.hits++;
        if (this.enableStats) {
            this.stats.hits++;
        }
        return entry.data;
    }
    /**
     * Set cached result
     */
    set(toolName, params, data) {
        const key = this.generateKey(toolName, params);
        const size = this.estimateSize(data);
        // Check if entry already exists (update case)
        const existing = this.cache.get(key);
        if (existing) {
            this.currentSize -= existing.size;
        }
        // Evict entries if necessary
        while ((this.cache.size >= this.maxEntries || this.currentSize + size > this.maxSize) &&
            this.accessOrder.length > 0) {
            this.evictLRU();
        }
        // Add new entry
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            hits: 0,
            size,
        });
        this.currentSize += size;
        this.updateAccessOrder(key);
    }
    /**
     * Check if result is cached
     */
    has(toolName, params) {
        const key = this.generateKey(toolName, params);
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.currentSize -= entry.size;
            return false;
        }
        return true;
    }
    /**
     * Clear specific tool's cache
     */
    clearTool(toolName) {
        let cleared = 0;
        const keysToDelete = [];
        for (const [key] of this.cache) {
            if (key.startsWith(`${toolName}:`)) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            const entry = this.cache.get(key);
            if (entry) {
                this.currentSize -= entry.size;
            }
            this.cache.delete(key);
            const orderIndex = this.accessOrder.indexOf(key);
            if (orderIndex !== -1) {
                this.accessOrder.splice(orderIndex, 1);
            }
            cleared++;
        }
        return cleared;
    }
    /**
     * Clear all cached results
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
        this.currentSize = 0;
        if (this.enableStats) {
            this.stats.hits = 0;
            this.stats.misses = 0;
            this.stats.evictions = 0;
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            evictions: this.stats.evictions,
            hitRate: total > 0 ? this.stats.hits / total : 0,
            totalEntries: this.cache.size,
            totalSize: this.currentSize,
            maxSize: this.maxSize,
        };
    }
    /**
     * Cleanup expired entries
     */
    cleanup() {
        let cleaned = 0;
        const now = Date.now();
        const keysToDelete = [];
        for (const [key, entry] of this.cache) {
            if (now - entry.timestamp > this.ttl) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            const entry = this.cache.get(key);
            if (entry) {
                this.currentSize -= entry.size;
            }
            this.cache.delete(key);
            const orderIndex = this.accessOrder.indexOf(key);
            if (orderIndex !== -1) {
                this.accessOrder.splice(orderIndex, 1);
            }
            cleaned++;
        }
        return cleaned;
    }
}
/**
 * Global cache instance for CTS tools
 */
export const globalCache = new ResultCache({
    maxEntries: 100,
    maxSize: 50 * 1024 * 1024, // 50MB
    ttl: 3600000, // 1 hour
    enableStats: true,
});
/**
 * Cache decorator for tool functions
 */
export function cached(toolName, cache = globalCache) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const params = args[0]; // Assume first arg is params object
            // Check cache
            const cached = cache.get(toolName, params);
            if (cached !== undefined) {
                return cached;
            }
            // Execute and cache result
            const result = await originalMethod.apply(this, args);
            cache.set(toolName, params, result);
            return result;
        };
        return descriptor;
    };
}
//# sourceMappingURL=result_cache.js.map