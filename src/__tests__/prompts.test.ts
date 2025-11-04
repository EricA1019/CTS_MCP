/**
 * Tests for MCP Prompts Protocol
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CTSMCPServer } from '../server.js';
import { PromptTemplate } from '../types.js';
import { TemplateRenderer } from '../prompts/template_renderer.js';
import { SCAN_SIGNALS_PROMPT, ALL_TOOL_PROMPTS } from '../prompts/tool_prompts.js';

describe('MCP Prompts Protocol', () => {
  let server: CTSMCPServer;

  beforeEach(() => {
    server = new CTSMCPServer();
  });

  describe('prompts/list', () => {
    it('should return empty array when no prompts registered', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'prompts/list',
      };

      const response = await server.handleMessage(request);
      
      expect(response.result).toEqual({ prompts: [] });
    });

    it('should return all registered prompts', async () => {
      const testPrompt: PromptTemplate = {
        name: 'test_prompt',
        description: 'Test prompt',
        arguments: [{ name: 'arg1', description: 'Test argument', required: true }],
        render: () => ({ description: 'test', messages: [] }),
      };

      server.registerPrompt('test_prompt', testPrompt);

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'prompts/list',
      };

      const response = await server.handleMessage(request);
      
      expect(response.result).toMatchObject({
        prompts: expect.arrayContaining([
          expect.objectContaining({
            name: 'test_prompt',
            description: 'Test prompt',
          }),
        ]),
      });
    });

    it('should include all tool prompts', async () => {
      ALL_TOOL_PROMPTS.forEach(prompt => {
        server.registerPrompt(prompt.name, prompt);
      });

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'prompts/list',
      };

      const response = await server.handleMessage(request);
      
      const result = response.result as { prompts: any[] };
      expect(result.prompts.length).toBe(ALL_TOOL_PROMPTS.length);
    });
  });

  describe('prompts/get', () => {
    beforeEach(() => {
      server.registerPrompt(SCAN_SIGNALS_PROMPT.name, SCAN_SIGNALS_PROMPT);
    });

    it('should render prompt with provided arguments', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'prompts/get',
        params: {
          name: 'cts_scan_signals_result',
          arguments: {
            signalCount: 42,
            fileCount: 10,
            hasIssues: false,
          },
        },
      };

      const response = await server.handleMessage(request);
      
      expect(response.result).toMatchObject({
        description: expect.stringContaining('42 signals'),
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'assistant',
            content: expect.objectContaining({
              type: 'text',
            }),
          }),
        ]),
      });
    });

    it('should return error for non-existent prompt', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'prompts/get',
        params: {
          name: 'nonexistent_prompt',
        },
      };

      const response = await server.handleMessage(request);
      
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('Prompt not found');
    });

    it('should handle missing optional arguments gracefully', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'prompts/get',
        params: {
          name: 'cts_scan_signals_result',
          arguments: {
            signalCount: 5,
            fileCount: 2,
            // hasIssues omitted (optional)
          },
        },
      };

      const response = await server.handleMessage(request);
      
      expect(response.result).toBeDefined();
      expect(response.error).toBeUndefined();
    });
  });

  describe('TemplateRenderer', () => {
    let renderer: TemplateRenderer;

    beforeEach(() => {
      renderer = new TemplateRenderer();
    });

    it('should substitute variables correctly', () => {
      const template = 'Hello {{name}}, you have {{count}} messages';
      const variables = { name: 'Alice', count: 5 };
      
      const result = renderer.render(template, variables);
      
      expect(result).toBe('Hello Alice, you have 5 messages');
    });

    it('should handle conditionals', () => {
      const template = 'Status: {{#if success}}OK{{/if}}';
      
      const resultTrue = renderer.render(template, { success: true });
      expect(resultTrue).toBe('Status: OK');
      
      const resultFalse = renderer.render(template, { success: false });
      expect(resultFalse).toBe('Status: ');
    });

    it('should escape special characters', () => {
      const template = 'Value: {{value}}';
      const variables = { value: '<script>alert("xss")</script>' };
      
      const result = renderer.render(template, variables);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should validate template syntax', () => {
      expect(renderer.validateTemplate('{{name}}')).toBe(true);
      expect(renderer.validateTemplate('{{#if test}}OK{{/if}}')).toBe(true);
      expect(renderer.validateTemplate('{{#if test}}OK')).toBe(false); // Missing close
    });

    it('should extract variables from template', () => {
      const template = 'Hello {{name}}, {{#if premium}}Premium{{/if}} user with {{points}} points';
      
      const variables = renderer.extractVariables(template);
      
      expect(variables).toContain('name');
      expect(variables).toContain('premium');
      expect(variables).toContain('points');
    });
  });

  describe('Performance', () => {
    it('should render prompts in <5ms', async () => {
      server.registerPrompt(SCAN_SIGNALS_PROMPT.name, SCAN_SIGNALS_PROMPT);

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'prompts/get',
        params: {
          name: 'cts_scan_signals_result',
          arguments: {
            signalCount: 100,
            fileCount: 50,
            hasIssues: true,
          },
        },
      };

      const start = performance.now();
      await server.handleMessage(request);
      const end = performance.now();
      
      const duration = end - start;
      expect(duration).toBeLessThan(5); // <5ms budget
    });
  });

  describe('Integration', () => {
    it('should list prompts capability in initialize', async () => {
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
          prompts: {},
        },
      });
    });
  });
});
