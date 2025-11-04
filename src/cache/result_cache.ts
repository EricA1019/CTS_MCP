/**
 * Result Caching System for CTS MCP Tools
 * 
 * Provides a generic LRU cache for expensive tool operations
 * with TTL support and cache statistics tracking.
 */

import crypto from 'crypto';

/**
 * Cached result entry
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  size: number; // Estimated size in bytes
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
  maxSize: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxEntries?: number;      // Maximum number of entries (default: 100)
  maxSize?: number;          // Maximum total size in bytes (default: 50MB)
  ttl?: number;              // Time to live in milliseconds (default: 1 hour)
  enableStats?: boolean;     // Enable statistics tracking (default: true)
}

/**
 * LRU Cache with TTL support
 */
export class ResultCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  private maxEntries: number;
  private maxSize: number;
  private ttl: number;
  private enableStats: boolean;
  private currentSize: number = 0;

  constructor(config: CacheConfig = {}) {
    this.maxEntries = config.maxEntries ?? 100;
    this.maxSize = config.maxSize ?? 50 * 1024 * 1024; // 50MB
    this.ttl = config.ttl ?? 3600000; // 1 hour
    this.enableStats = config.enableStats ?? true;
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(toolName: string, params: any): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    const hash = crypto.createHash('sha256').update(toolName + paramString).digest('hex');
    return `${toolName}:${hash.substring(0, 16)}`;
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: T): number {
    const json = JSON.stringify(data);
    return Buffer.byteLength(json, 'utf8');
  }

  /**
   * Remove least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;
    
    const lruKey = this.accessOrder.shift()!;
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
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
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
  get(toolName: string, params: any): T | undefined {
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
  set(toolName: string, params: any, data: T): void {
    const key = this.generateKey(toolName, params);
    const size = this.estimateSize(data);

    // Check if entry already exists (update case)
    const existing = this.cache.get(key);
    if (existing) {
      this.currentSize -= existing.size;
    }

    // Evict entries if necessary
    while (
      (this.cache.size >= this.maxEntries || this.currentSize + size > this.maxSize) &&
      this.accessOrder.length > 0
    ) {
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
  has(toolName: string, params: any): boolean {
    const key = this.generateKey(toolName, params);
    const entry = this.cache.get(key);
    
    if (!entry) return false;
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
  clearTool(toolName: string): number {
    let cleared = 0;
    const keysToDelete: string[] = [];

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
  clear(): void {
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
  getStats(): CacheStats {
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
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    const keysToDelete: string[] = [];

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
export function cached<T>(toolName: string, cache: ResultCache<T> = globalCache as any) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
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
