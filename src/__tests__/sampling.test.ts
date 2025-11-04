/**
 * Unit Tests: MCP Sampling Protocol
 * Following Quinn's comprehensive testing methodology
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  checkResponseSize, 
  truncateLargeArrays,
  SamplingManager 
} from '../sampling/index.js';

describe('MCP Sampling Protocol - Unit Tests', () => {
  describe('checkResponseSize()', () => {
    it('should not truncate small data', () => {
      const data = { message: 'Hello', count: 42 };
      const result = checkResponseSize(data, 1000);
      
      expect(result.truncated).toBe(false);
      expect(result.data).toEqual(data);
      expect(result.originalSize).toBeLessThan(1000);
    });
    
    it('should flag large data as truncated', () => {
      const largeData = { text: 'x'.repeat(100000) };
      const result = checkResponseSize(largeData, 30000);
      
      expect(result.truncated).toBe(true);
      expect(result.originalSize).toBeGreaterThan(30000);
      expect(result.data).toEqual(largeData);
    });
    
    it('should calculate accurate original size', () => {
      const data = { test: 'data', num: 123 };
      const result = checkResponseSize(data);
      
      expect(result.originalSize).toBe(JSON.stringify(data).length);
    });
    
    it('should handle exactly at size boundary', () => {
      const data = { text: 'x'.repeat(59970) }; // ~60000 bytes with JSON overhead
      const result = checkResponseSize(data, 60000);
      
      // Should be close to boundary
      expect(result.originalSize).toBeGreaterThan(59900);
      expect(result.originalSize).toBeLessThan(60100);
    });
  });
  
  describe('truncateLargeArrays()', () => {
    it('should not modify data without large arrays', () => {
      const data = { items: [1, 2, 3], name: 'test' };
      const result = truncateLargeArrays(data, 10);
      
      expect(result.items).toEqual([1, 2, 3]);
      expect(result._truncated).toBeUndefined();
    });
    
    it('should truncate arrays exceeding max length', () => {
      const data = { 
        violations: Array.from({ length: 50 }, (_, i) => ({ id: i })),
        name: 'test'
      };
      const result = truncateLargeArrays(data, 10);
      
      expect(result.violations).toHaveLength(10);
      expect(result._truncated).toBeDefined();
      expect(result._truncated).toContain('violations (50 total, showing 10)');
    });
    
    it('should preserve non-array fields', () => {
      const data = { 
        items: Array.from({ length: 20 }, (_, i) => i),
        score: 95,
        name: 'Report'
      };
      const result = truncateLargeArrays(data, 5);
      
      expect(result.score).toBe(95);
      expect(result.name).toBe('Report');
      expect(result.items).toHaveLength(5);
    });
    
    it('should truncate multiple arrays', () => {
      const data = {
        errors: Array.from({ length: 30 }, (_, i) => `error${i}`),
        warnings: Array.from({ length: 25 }, (_, i) => `warn${i}`),
      };
      const result = truncateLargeArrays(data, 10);
      
      expect(result.errors).toHaveLength(10);
      expect(result.warnings).toHaveLength(10);
      expect(result._truncated).toHaveLength(2);
    });
    
    it('should use custom max length', () => {
      const data = { items: Array.from({ length: 100 }, (_, i) => i) };
      const result = truncateLargeArrays(data, 20);
      
      expect(result.items).toHaveLength(20);
      expect(result._truncated?.[0]).toContain('100 total, showing 20');
    });
  });
  
  describe('SamplingManager', () => {
    let manager: SamplingManager;
    
    beforeEach(() => {
      manager = new SamplingManager();
    });
    
    it('should start operation with initial state', () => {
      manager.startOperation('op1', 5000);
      const state = manager.getState('op1');
      
      expect(state).toBeDefined();
      expect(state?.operationId).toBe('op1');
      expect(state?.status).toBe('running');
      expect(state?.estimatedDuration).toBe(5000);
      expect(state?.startTime).toBeLessThanOrEqual(Date.now());
    });
    
    it('should update operation progress', () => {
      manager.startOperation('op2');
      manager.updateProgress('op2', 50);
      
      const state = manager.getState('op2');
      expect(state?.progress).toBe(50);
    });
    
    it('should clamp progress to 0-100 range', () => {
      manager.startOperation('op3');
      manager.updateProgress('op3', 150);
      expect(manager.getState('op3')?.progress).toBe(100);
      
      manager.updateProgress('op3', -10);
      expect(manager.getState('op3')?.progress).toBe(0);
    });
    
    it('should complete operation with result', () => {
      manager.startOperation('op4');
      const result = { data: 'completed' };
      manager.completeOperation('op4', result);
      
      const state = manager.getState('op4');
      expect(state?.status).toBe('completed');
      expect(state?.result).toEqual(result);
      expect(state?.progress).toBe(100);
    });
    
    it('should fail operation with error', () => {
      manager.startOperation('op5');
      manager.failOperation('op5', 'Test error');
      
      const state = manager.getState('op5');
      expect(state?.status).toBe('failed');
      expect(state?.error).toBe('Test error');
    });
    
    it('should return undefined for non-existent operation', () => {
      const state = manager.getState('nonexistent');
      expect(state).toBeUndefined();
    });
    
    it('should cleanup old completed operations', () => {
      manager.startOperation('old1');
      manager.completeOperation('old1', {});
      
      // Manually set old timestamp
      const state = manager.getState('old1');
      if (state) {
        state.startTime = Date.now() - 400000; // 6.6 minutes ago
      }
      
      manager.cleanup(300000); // 5 minute TTL
      expect(manager.getState('old1')).toBeUndefined();
    });
    
    it('should not cleanup running operations', () => {
      manager.startOperation('running1');
      const state = manager.getState('running1');
      if (state) {
        state.startTime = Date.now() - 400000;
      }
      
      manager.cleanup(300000);
      expect(manager.getState('running1')).toBeDefined();
    });
    
    it('should not cleanup recent completed operations', () => {
      manager.startOperation('recent1');
      manager.completeOperation('recent1', {});
      
      manager.cleanup(300000);
      expect(manager.getState('recent1')).toBeDefined();
    });
  });
});
