/**
 * Tests for MCP Resources Protocol
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CTSMCPServer } from '../server.js';
import { PromptLoader } from '../resources/prompt_loader.js';
import { Resource, ResourceContents } from '../types.js';

describe('MCP Resources Protocol', () => {
  let server: CTSMCPServer;
  let promptLoader: PromptLoader;

  beforeEach(() => {
    server = new CTSMCPServer();
    promptLoader = new PromptLoader();
  });

  describe('resources/list', () => {
    it('should return empty array when no resources registered', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
      };

      const response = await server.handleMessage(request);
      
      expect(response.result).toEqual({ resources: [] });
    });

    it('should return all registered resources', async () => {
      const resource1: Resource = {
        uri: 'prompt://test/1',
        name: 'Test Prompt 1',
        mimeType: 'text/plain',
      };

      const resource2: Resource = {
        uri: 'prompt://test/2',
        name: 'Test Prompt 2',
        description: 'A test prompt',
        mimeType: 'text/plain',
      };

      server.registerResource(resource1.uri, resource1);
      server.registerResource(resource2.uri, resource2);

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
      };

      const response = await server.handleMessage(request);
      
      expect(response.result).toMatchObject({
        resources: expect.arrayContaining([
          expect.objectContaining({ uri: 'prompt://test/1' }),
          expect.objectContaining({ uri: 'prompt://test/2' }),
        ]),
      });
    });
  });

  describe('resources/read', () => {
    it('should return resource content for valid URI', async () => {
      const testContent = 'This is test prompt content';
      const mockProvider = async (uri: string): Promise<ResourceContents> => {
        if (uri === 'prompt://test/1') {
          return {
            uri,
            mimeType: 'text/plain',
            text: testContent,
          };
        }
        throw new Error(`Resource not found: ${uri}`);
      };

      const resource: Resource = {
        uri: 'prompt://test/1',
        name: 'Test Prompt',
        mimeType: 'text/plain',
      };

      server.registerResource(resource.uri, resource);
      server.setResourceContentProvider(mockProvider);

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: { uri: 'prompt://test/1' },
      };

      const response = await server.handleMessage(request);
      
      expect(response.result).toMatchObject({
        contents: [
          {
            uri: 'prompt://test/1',
            mimeType: 'text/plain',
            text: testContent,
          },
        ],
      });
    });

    it('should return error for invalid URI', async () => {
      const mockProvider = async (uri: string): Promise<ResourceContents> => {
        throw new Error(`Resource not found: ${uri}`);
      };

      server.setResourceContentProvider(mockProvider);

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: { uri: 'prompt://nonexistent' },
      };

      const response = await server.handleMessage(request);
      
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('Resource not found');
    });

    it('should return error when content provider not configured', async () => {
      const resource: Resource = {
        uri: 'prompt://test/1',
        name: 'Test Prompt',
        mimeType: 'text/plain',
      };

      server.registerResource(resource.uri, resource);

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: { uri: 'prompt://test/1' },
      };

      const response = await server.handleMessage(request);
      
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('content provider not configured');
    });
  });

  describe('PromptLoader', () => {
    it('should validate correct prompt structure', () => {
      const validPrompt = {
        uri: 'prompt://test',
        name: 'Test',
        content: 'Test content',
      };

      expect(promptLoader.validatePromptStructure(validPrompt)).toBe(true);
    });

    it('should reject invalid prompt structure', () => {
      const invalidPrompt = {
        uri: 'prompt://test',
        // missing name and content
      };

      expect(promptLoader.validatePromptStructure(invalidPrompt)).toBe(false);
    });

    it('should read cached content', async () => {
      // Manually cache some content for testing
      const uri = 'prompt://test';
      const content = 'Test content';
      
      // Access private cache through type assertion for testing
      (promptLoader as any).cache.set(uri, content);

      const result = await promptLoader.readPromptContent(uri);
      
      expect(result.uri).toBe(uri);
      expect(result.text).toBe(content);
      expect(result.mimeType).toBe('text/plain');
    });

    it('should throw error for uncached URI', async () => {
      await expect(
        promptLoader.readPromptContent('prompt://nonexistent')
      ).rejects.toThrow('Resource not found');
    });
  });

  describe('Integration', () => {
    it('should list resources capability in initialize', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'initialize',
      };

      const response = await server.handleMessage(request);
      
      expect(response.result).toMatchObject({
        capabilities: {
          tools: {},
          resources: {},
        },
      });
    });
  });
});
