/**/**/**

 * Tests for Tool Wrapper

 * Following Quinn's comprehensive testing methodology * Tests for Tool Wrapper * Tests for Tool Wrapper

 */

 * Following Quinn's comprehensive testing methodology * Following Quinn's comprehensive testing methodology

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

import { wrapToolHandler, withCache, withObservability } from '../tool-wrapper.js'; */ */

import { globalCache } from '../../cache/result-cache.js';

import { metrics, type ToolMetrics } from '../../observability/index.js';

import type { ToolHandler } from '../../types.js';

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

describe('Tool Wrapper', () => {

  beforeEach(() => {import { wrapToolHandler, withCache, withObservability } from '../tool-wrapper.js';import { wrapToolHandler, withCache, withObservability } from '../tool-wrapper.js';

    jest.clearAllMocks();

    globalCache.clear();import { globalCache } from '../../cache/result-cache.js';import { globalCache } from '../../cache/result-cache.js';

    metrics.reset();

  });import { metrics, type ToolMetrics } from '../../observability/index.js';import { metrics, type ToolMetrics } from '../../observability/index.js';



  afterEach(() => {import type { ToolHandler } from '../../types.js';import type { ToolHandler } from '../../types.js';

    jest.restoreAllMocks();

  });



  describe('wrapToolHandler', () => {describe('Tool Wrapper', () => {// Type for test results with cache metadata

    it('should execute tool handler and record metrics', async () => {

      // Arrange  beforeEach(() => {type TestResult = Record<string, any> & { cached?: boolean };

      const handler = jest.fn<ToolHandler>().mockResolvedValue({ success: true, data: 'test' });

      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: false });    jest.clearAllMocks();



      // Act    globalCache.clear();describe('Tool Wrapper', () => {

      const result = await wrapped({ arg1: 'value1' });

    metrics.reset();  beforeEach(() => {

      // Assert

      expect(handler).toHaveBeenCalledWith({ arg1: 'value1' });  });    jest.clearAllMocks();

      expect(result).toEqual({ success: true, data: 'test' });

    globalCache.clear();

      const toolMetrics = metrics.getToolMetrics('TestTool') as ToolMetrics;

      expect(toolMetrics.executionCount).toBe(1);  afterEach(() => {    metrics.reset();

      expect(toolMetrics.errorCount).toBe(0);

    });    jest.restoreAllMocks();  });



    it('should handle tool execution errors', async () => {  });

      // Arrange

      const error = new Error('Tool failed');  afterEach(() => {

      const handler = jest.fn<ToolHandler>().mockRejectedValue(error);

      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: false });  describe('wrapToolHandler', () => {    jest.restoreAllMocks();



      // Act & Assert    it('should execute tool handler and record metrics', async () => {  });

      await expect(wrapped({ arg1: 'value1' })).rejects.toThrow('Tool failed');

      // Arrange

      const toolMetrics = metrics.getToolMetrics('TestTool') as ToolMetrics;

      expect(toolMetrics.executionCount).toBe(1);      const handler = jest.fn<ToolHandler>().mockResolvedValue({ success: true, data: 'test' });  describe('wrapToolHandler', () => {

      expect(toolMetrics.errorCount).toBe(1);

    });      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: false });    it('should execute tool handler and record metrics', async () => {



    it('should record execution duration', async () => {      // Arrange

      // Arrange

      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {      // Act      const handler = jest.fn<ToolHandler>().mockResolvedValue({ success: true, data: 'test' });

        await new Promise(resolve => setTimeout(resolve, 10));

        return { success: true };      const result = await wrapped({ arg1: 'value1' });      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: false });

      });

      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: false });



      // Act      // Assert      // Act

      await wrapped({});

      expect(handler).toHaveBeenCalledWith({ arg1: 'value1' });      const result = await wrapped({ arg1: 'value1' });

      // Assert

      const toolMetrics = metrics.getToolMetrics('TestTool') as ToolMetrics;      expect(result).toEqual({ success: true, data: 'test' });

      expect(toolMetrics.averageDuration).toBeGreaterThan(5); // At least 5ms

    });      // Assert

  });

      const toolMetrics = metrics.getToolMetrics('TestTool') as ToolMetrics;      expect(handler).toHaveBeenCalledWith({ arg1: 'value1' });

  describe('Caching', () => {

    it('should cache results when cacheable=true', async () => {      expect(toolMetrics.executionCount).toBe(1);      expect(result).toEqual({ success: true, data: 'test' });

      // Arrange

      let callCount = 0;      expect(toolMetrics.errorCount).toBe(0);

      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {

        callCount++;    });      const toolMetrics = metrics.getToolMetrics('TestTool') as ToolMetrics;

        return { success: true, data: `call_${callCount}` };

      });      expect(toolMetrics.executionCount).toBe(1);

      const wrapped = wrapToolHandler(handler, { toolName: 'CacheableTool', cacheable: true });

      const args = { projectPath: '/path/to/project' };    it('should handle tool execution errors', async () => {      expect(toolMetrics.errorCount).toBe(0);



      // Act      // Arrange    });

      const result1 = await wrapped(args);

      const result2 = await wrapped(args);      const error = new Error('Tool failed');



      // Assert      const handler = jest.fn<ToolHandler>().mockRejectedValue(error);    it('should handle tool execution errors', async () => {

      expect(handler).toHaveBeenCalledTimes(1); // Only called once

      expect((result1 as any).data).toBe('call_1');      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: false });      // Arrange

      expect((result2 as any).data).toBe('call_1'); // Same result from cache

      expect((result1 as any).cached).toBe(false);      const error = new Error('Tool failed');

      expect((result2 as any).cached).toBe(true);

      // Act & Assert      const handler = jest.fn<ToolHandler>().mockRejectedValue(error);

      const toolMetrics = metrics.getToolMetrics('CacheableTool') as ToolMetrics;

      expect(toolMetrics.cacheHitRate).toBe(0.5); // 1 hit, 1 miss      await expect(wrapped({ arg1: 'value1' })).rejects.toThrow('Tool failed');      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: false });

    });



    it('should not cache when cacheable=false', async () => {

      // Arrange      const toolMetrics = metrics.getToolMetrics('TestTool') as ToolMetrics;      // Act & Assert

      let callCount = 0;

      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {      expect(toolMetrics.executionCount).toBe(1);      await expect(wrapped({ arg1: 'value1' })).rejects.toThrow('Tool failed');

        callCount++;

        return { success: true, data: `call_${callCount}` };      expect(toolMetrics.errorCount).toBe(1);

      });

      const wrapped = wrapToolHandler(handler, { toolName: 'NonCacheableTool', cacheable: false });    });      const toolMetrics = metrics.getToolMetrics('TestTool') as ToolMetrics;

      const args = { projectPath: '/path/to/project' };

      expect(toolMetrics.executionCount).toBe(1);

      // Act

      const result1 = await wrapped(args);    it('should record execution duration', async () => {      expect(toolMetrics.errorCount).toBe(1);

      const result2 = await wrapped(args);

      // Arrange    });

      // Assert

      expect(handler).toHaveBeenCalledTimes(2); // Called twice      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {

      expect((result1 as any).data).toBe('call_1');

      expect((result2 as any).data).toBe('call_2'); // Different result        await new Promise(resolve => setTimeout(resolve, 10));    it('should record execution duration', async () => {

    });

        return { success: true };      // Arrange

    it('should bypass cache when _bypassCache=true', async () => {

      // Arrange      });      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {

      let callCount = 0;

      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: false });        await new Promise(resolve => setTimeout(resolve, 10));

        callCount++;

        return { success: true, data: `call_${callCount}` };        return { success: true };

      });

      const wrapped = wrapToolHandler(handler, { toolName: 'CacheableTool', cacheable: true });      // Act      });



      // Act      await wrapped({});      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: false });

      const result1 = await wrapped({ projectPath: '/path' });

      const result2 = await wrapped({ projectPath: '/path', _bypassCache: true });

      const result3 = await wrapped({ projectPath: '/path' });

      // Assert      // Act

      // Assert

      expect(handler).toHaveBeenCalledTimes(2); // Called twice (bypass skips cache)      const toolMetrics = metrics.getToolMetrics('TestTool') as ToolMetrics;      await wrapped({});

      expect((result1 as any).data).toBe('call_1');

      expect((result2 as any).data).toBe('call_2'); // Bypassed cache      expect(toolMetrics.averageDuration).toBeGreaterThan(5); // At least 5ms

      expect((result3 as any).data).toBe('call_1'); // From cache (first call)

    });    });      // Assert



    it('should remove _bypassCache from args before processing', async () => {  });      const toolMetrics = metrics.getToolMetrics('TestTool');

      // Arrange

      const handler = jest.fn<ToolHandler>().mockResolvedValue({ success: true });      expect(toolMetrics.averageDuration).toBeGreaterThan(5); // At least 5ms

      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: true });

  describe('Caching', () => {    });

      // Act

      await wrapped({ projectPath: '/path', _bypassCache: true });    it('should cache results when cacheable=true', async () => {  });



      // Assert      // Arrange

      expect(handler).toHaveBeenCalledWith({ projectPath: '/path' });

      expect(handler).not.toHaveBeenCalledWith(expect.objectContaining({ _bypassCache: true }));      let callCount = 0;  describe('Caching', () => {

    });

      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {    it('should cache results when cacheable=true', async () => {

    it('should cache different results for different arguments', async () => {

      // Arrange        callCount++;      // Arrange

      const handler = jest.fn<ToolHandler>().mockImplementation(async (args: any) => {

        return { success: true, path: args.projectPath };        return { success: true, data: `call_${callCount}` };      let callCount = 0;

      });

      const wrapped = wrapToolHandler(handler, { toolName: 'CacheableTool', cacheable: true });      });      const handler = jest.fn().mockImplementation(async () => {



      // Act      const wrapped = wrapToolHandler(handler, { toolName: 'CacheableTool', cacheable: true });        callCount++;

      const result1 = await wrapped({ projectPath: '/path1' });

      const result2 = await wrapped({ projectPath: '/path2' });      const args = { projectPath: '/path/to/project' };        return { success: true, data: `call_${callCount}` };

      const result3 = await wrapped({ projectPath: '/path1' }); // Same as first

      });

      // Assert

      expect(handler).toHaveBeenCalledTimes(2); // path1, path2      // Act      const wrapped = wrapToolHandler(handler, { toolName: 'CacheableTool', cacheable: true });

      expect((result1 as any).path).toBe('/path1');

      expect((result2 as any).path).toBe('/path2');      const result1 = await wrapped(args);      const args = { projectPath: '/path/to/project' };

      expect((result3 as any).path).toBe('/path1'); // From cache

      expect((result3 as any).cached).toBe(true);      const result2 = await wrapped(args);

    });

  });      // Act



  describe('Convenience Functions', () => {      // Assert      const result1 = await wrapped(args);

    it('withCache should create cacheable handler', async () => {

      // Arrange      expect(handler).toHaveBeenCalledTimes(1); // Only called once      const result2 = await wrapped(args);

      let callCount = 0;

      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {      expect((result1 as any).data).toBe('call_1');

        callCount++;

        return { success: true, data: `call_${callCount}` };      expect((result2 as any).data).toBe('call_1'); // Same result from cache      // Assert

      });

      const wrapped = withCache('CacheableTool', handler);      expect((result1 as any).cached).toBe(false);      expect(handler).toHaveBeenCalledTimes(1); // Only called once



      // Act      expect((result2 as any).cached).toBe(true);      expect(result1.data).toBe('call_1');

      const result1 = await wrapped({ arg: 'value' });

      const result2 = await wrapped({ arg: 'value' });      expect(result2.data).toBe('call_1'); // Same result from cache



      // Assert      const toolMetrics = metrics.getToolMetrics('CacheableTool') as ToolMetrics;      expect(result1.cached).toBe(false);

      expect(handler).toHaveBeenCalledTimes(1);

      expect((result2 as any).cached).toBe(true);      expect(toolMetrics.cacheHitRate).toBe(0.5); // 1 hit, 1 miss      expect(result2.cached).toBe(true);

    });

    });

    it('withObservability should create non-cacheable handler', async () => {

      // Arrange      const toolMetrics = metrics.getToolMetrics('CacheableTool');

      let callCount = 0;

      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {    it('should not cache when cacheable=false', async () => {      expect(toolMetrics.cacheHitRate).toBe(0.5); // 1 hit, 1 miss

        callCount++;

        return { success: true, data: `call_${callCount}` };      // Arrange    });

      });

      const wrapped = withObservability('NonCacheableTool', handler);      let callCount = 0;



      // Act      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {    it('should not cache when cacheable=false', async () => {

      const result1 = await wrapped({ arg: 'value' });

      const result2 = await wrapped({ arg: 'value' });        callCount++;      // Arrange



      // Assert        return { success: true, data: `call_${callCount}` };      let callCount = 0;

      expect(handler).toHaveBeenCalledTimes(2);

      expect((result1 as any).data).toBe('call_1');      });      const handler = jest.fn().mockImplementation(async () => {

      expect((result2 as any).data).toBe('call_2');

    });      const wrapped = wrapToolHandler(handler, { toolName: 'NonCacheableTool', cacheable: false });        callCount++;

  });

      const args = { projectPath: '/path/to/project' };        return { success: true, data: `call_${callCount}` };

  describe('Metrics Recording', () => {

    it('should record successful execution metrics', async () => {      });

      // Arrange

      const handler = jest.fn<ToolHandler>().mockResolvedValue({ success: true });      // Act      const wrapped = wrapToolHandler(handler, { toolName: 'NonCacheableTool', cacheable: false });

      const wrapped = wrapToolHandler(handler, { toolName: 'MetricsTool', cacheable: false });

      const result1 = await wrapped(args);      const args = { projectPath: '/path/to/project' };

      // Act

      await wrapped({});      const result2 = await wrapped(args);



      // Assert      // Act

      const toolMetrics = metrics.getToolMetrics('MetricsTool') as ToolMetrics;

      expect(toolMetrics.executionCount).toBe(1);      // Assert      const result1 = await wrapped(args);

      expect(toolMetrics.errorCount).toBe(0);

      expect(toolMetrics.averageDuration).toBeGreaterThan(0);      expect(handler).toHaveBeenCalledTimes(2); // Called twice      const result2 = await wrapped(args);

    });

      expect((result1 as any).data).toBe('call_1');

    it('should record failed execution metrics', async () => {

      // Arrange      expect((result2 as any).data).toBe('call_2'); // Different result      // Assert

      const handler = jest.fn<ToolHandler>().mockRejectedValue(new Error('Failed'));

      const wrapped = wrapToolHandler(handler, { toolName: 'MetricsTool', cacheable: false });    });      expect(handler).toHaveBeenCalledTimes(2); // Called twice



      // Act      expect(result1.data).toBe('call_1');

      try {

        await wrapped({});    it('should bypass cache when _bypassCache=true', async () => {      expect(result2.data).toBe('call_2'); // Different result

      } catch (error) {

        // Expected      // Arrange    });

      }

      let callCount = 0;

      // Assert

      const toolMetrics = metrics.getToolMetrics('MetricsTool') as ToolMetrics;      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {    it('should bypass cache when _bypassCache=true', async () => {

      expect(toolMetrics.executionCount).toBe(1);

      expect(toolMetrics.errorCount).toBe(1);        callCount++;      // Arrange

    });

        return { success: true, data: `call_${callCount}` };      let callCount = 0;

    it('should record cache hit rate', async () => {

      // Arrange      });      const handler = jest.fn().mockImplementation(async () => {

      const handler = jest.fn<ToolHandler>().mockResolvedValue({ success: true });

      const wrapped = wrapToolHandler(handler, { toolName: 'CacheTool', cacheable: true });      const wrapped = wrapToolHandler(handler, { toolName: 'CacheableTool', cacheable: true });        callCount++;



      // Act        return { success: true, data: `call_${callCount}` };

      await wrapped({ arg: 'value' }); // Miss

      await wrapped({ arg: 'value' }); // Hit      // Act      });

      await wrapped({ arg: 'value' }); // Hit

      const result1 = await wrapped({ projectPath: '/path' });      const wrapped = wrapToolHandler(handler, { toolName: 'CacheableTool', cacheable: true });

      // Assert

      const toolMetrics = metrics.getToolMetrics('CacheTool') as ToolMetrics;      const result2 = await wrapped({ projectPath: '/path', _bypassCache: true });

      expect(toolMetrics.cacheHitRate).toBeCloseTo(0.667, 2); // 2/3 hits

    });      const result3 = await wrapped({ projectPath: '/path' });      // Act

  });

});      const result1 = await wrapped({ projectPath: '/path' });


      // Assert      const result2 = await wrapped({ projectPath: '/path', _bypassCache: true });

      expect(handler).toHaveBeenCalledTimes(2); // Called twice (bypass skips cache)      const result3 = await wrapped({ projectPath: '/path' });

      expect((result1 as any).data).toBe('call_1');

      expect((result2 as any).data).toBe('call_2'); // Bypassed cache      // Assert

      expect((result3 as any).data).toBe('call_1'); // From cache (first call)      expect(handler).toHaveBeenCalledTimes(2); // Called twice (bypass skips cache)

    });      expect(result1.data).toBe('call_1');

      expect(result2.data).toBe('call_2'); // Bypassed cache

    it('should remove _bypassCache from args before processing', async () => {      expect(result3.data).toBe('call_1'); // From cache (first call)

      // Arrange    });

      const handler = jest.fn<ToolHandler>().mockResolvedValue({ success: true });

      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: true });    it('should remove _bypassCache from args before processing', async () => {

      // Arrange

      // Act      const handler = jest.fn().mockResolvedValue({ success: true });

      await wrapped({ projectPath: '/path', _bypassCache: true });      const wrapped = wrapToolHandler(handler, { toolName: 'TestTool', cacheable: true });



      // Assert      // Act

      expect(handler).toHaveBeenCalledWith({ projectPath: '/path' });      await wrapped({ projectPath: '/path', _bypassCache: true });

      expect(handler).not.toHaveBeenCalledWith(expect.objectContaining({ _bypassCache: true }));

    });      // Assert

      expect(handler).toHaveBeenCalledWith({ projectPath: '/path' });

    it('should cache different results for different arguments', async () => {      expect(handler).not.toHaveBeenCalledWith(expect.objectContaining({ _bypassCache: true }));

      // Arrange    });

      const handler = jest.fn<ToolHandler>().mockImplementation(async (args: any) => {

        return { success: true, path: args.projectPath };    it('should cache different results for different arguments', async () => {

      });      // Arrange

      const wrapped = wrapToolHandler(handler, { toolName: 'CacheableTool', cacheable: true });      const handler = jest.fn().mockImplementation(async (args: any) => {

        return { success: true, path: args.projectPath };

      // Act      });

      const result1 = await wrapped({ projectPath: '/path1' });      const wrapped = wrapToolHandler(handler, { toolName: 'CacheableTool', cacheable: true });

      const result2 = await wrapped({ projectPath: '/path2' });

      const result3 = await wrapped({ projectPath: '/path1' }); // Same as first      // Act

      const result1 = await wrapped({ projectPath: '/path1' });

      // Assert      const result2 = await wrapped({ projectPath: '/path2' });

      expect(handler).toHaveBeenCalledTimes(2); // path1, path2      const result3 = await wrapped({ projectPath: '/path1' }); // Same as first

      expect((result1 as any).path).toBe('/path1');

      expect((result2 as any).path).toBe('/path2');      // Assert

      expect((result3 as any).path).toBe('/path1'); // From cache      expect(handler).toHaveBeenCalledTimes(2); // path1, path2

      expect((result3 as any).cached).toBe(true);      expect(result1.path).toBe('/path1');

    });      expect(result2.path).toBe('/path2');

  });      expect(result3.path).toBe('/path1'); // From cache

      expect(result3.cached).toBe(true);

  describe('Convenience Functions', () => {    });

    it('withCache should create cacheable handler', async () => {  });

      // Arrange

      let callCount = 0;  describe('Convenience Functions', () => {

      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {    it('withCache should create cacheable handler', async () => {

        callCount++;      // Arrange

        return { success: true, data: `call_${callCount}` };      let callCount = 0;

      });      const handler = jest.fn().mockImplementation(async () => {

      const wrapped = withCache('CacheableTool', handler);        callCount++;

        return { success: true, data: `call_${callCount}` };

      // Act      });

      const result1 = await wrapped({ arg: 'value' });      const wrapped = withCache('CacheableTool', handler);

      const result2 = await wrapped({ arg: 'value' });

      // Act

      // Assert      const result1 = await wrapped({ arg: 'value' });

      expect(handler).toHaveBeenCalledTimes(1);      const result2 = await wrapped({ arg: 'value' });

      expect((result2 as any).cached).toBe(true);

    });      // Assert

      expect(handler).toHaveBeenCalledTimes(1);

    it('withObservability should create non-cacheable handler', async () => {      expect(result2.cached).toBe(true);

      // Arrange    });

      let callCount = 0;

      const handler = jest.fn<ToolHandler>().mockImplementation(async () => {    it('withObservability should create non-cacheable handler', async () => {

        callCount++;      // Arrange

        return { success: true, data: `call_${callCount}` };      let callCount = 0;

      });      const handler = jest.fn().mockImplementation(async () => {

      const wrapped = withObservability('NonCacheableTool', handler);        callCount++;

        return { success: true, data: `call_${callCount}` };

      // Act      });

      const result1 = await wrapped({ arg: 'value' });      const wrapped = withObservability('NonCacheableTool', handler);

      const result2 = await wrapped({ arg: 'value' });

      // Act

      // Assert      const result1 = await wrapped({ arg: 'value' });

      expect(handler).toHaveBeenCalledTimes(2);      const result2 = await wrapped({ arg: 'value' });

      expect((result1 as any).data).toBe('call_1');

      expect((result2 as any).data).toBe('call_2');      // Assert

    });      expect(handler).toHaveBeenCalledTimes(2);

  });      expect(result1.data).toBe('call_1');

      expect(result2.data).toBe('call_2');

  describe('Metrics Recording', () => {    });

    it('should record successful execution metrics', async () => {  });

      // Arrange

      const handler = jest.fn<ToolHandler>().mockResolvedValue({ success: true });  describe('Metrics Recording', () => {

      const wrapped = wrapToolHandler(handler, { toolName: 'MetricsTool', cacheable: false });    it('should record successful execution metrics', async () => {

      // Arrange

      // Act      const handler = jest.fn().mockResolvedValue({ success: true });

      await wrapped({});      const wrapped = wrapToolHandler(handler, { toolName: 'MetricsTool', cacheable: false });



      // Assert      // Act

      const toolMetrics = metrics.getToolMetrics('MetricsTool') as ToolMetrics;      await wrapped({});

      expect(toolMetrics.executionCount).toBe(1);

      expect(toolMetrics.errorCount).toBe(0);      // Assert

      expect(toolMetrics.averageDuration).toBeGreaterThan(0);      const toolMetrics = metrics.getToolMetrics('MetricsTool');

    });      expect(toolMetrics.executionCount).toBe(1);

      expect(toolMetrics.errorCount).toBe(0);

    it('should record failed execution metrics', async () => {      expect(toolMetrics.averageDuration).toBeGreaterThan(0);

      // Arrange    });

      const handler = jest.fn<ToolHandler>().mockRejectedValue(new Error('Failed'));

      const wrapped = wrapToolHandler(handler, { toolName: 'MetricsTool', cacheable: false });    it('should record failed execution metrics', async () => {

      // Arrange

      // Act      const handler = jest.fn().mockRejectedValue(new Error('Failed'));

      try {      const wrapped = wrapToolHandler(handler, { toolName: 'MetricsTool', cacheable: false });

        await wrapped({});

      } catch (error) {      // Act

        // Expected      try {

      }        await wrapped({});

      } catch (error) {

      // Assert        // Expected

      const toolMetrics = metrics.getToolMetrics('MetricsTool') as ToolMetrics;      }

      expect(toolMetrics.executionCount).toBe(1);

      expect(toolMetrics.errorCount).toBe(1);      // Assert

    });      const toolMetrics = metrics.getToolMetrics('MetricsTool');

      expect(toolMetrics.executionCount).toBe(1);

    it('should record cache hit rate', async () => {      expect(toolMetrics.errorCount).toBe(1);

      // Arrange    });

      const handler = jest.fn<ToolHandler>().mockResolvedValue({ success: true });

      const wrapped = wrapToolHandler(handler, { toolName: 'CacheTool', cacheable: true });    it('should record cache hit rate', async () => {

      // Arrange

      // Act      const handler = jest.fn().mockResolvedValue({ success: true });

      await wrapped({ arg: 'value' }); // Miss      const wrapped = wrapToolHandler(handler, { toolName: 'CacheTool', cacheable: true });

      await wrapped({ arg: 'value' }); // Hit

      await wrapped({ arg: 'value' }); // Hit      // Act

      await wrapped({ arg: 'value' }); // Miss

      // Assert      await wrapped({ arg: 'value' }); // Hit

      const toolMetrics = metrics.getToolMetrics('CacheTool') as ToolMetrics;      await wrapped({ arg: 'value' }); // Hit

      expect(toolMetrics.cacheHitRate).toBeCloseTo(0.667, 2); // 2/3 hits

    });      // Assert

  });      const toolMetrics = metrics.getToolMetrics('CacheTool');

});      expect(toolMetrics.cacheHitRate).toBeCloseTo(0.667, 2); // 2/3 hits

    });
  });
});
