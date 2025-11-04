/**
 * Sampling Handler Tests
 * 
 * Tests for MCP sampling protocol implementation
 */

import { describe, it, expect } from '@jest/globals';
import {
  CreateMessageParamsSchema,
  ContextInjector,
  SamplingRequestBuilder,
  SamplingTemplates,
} from '../sampling/sampling_handler.js';

describe('Sampling Protocol', () => {
  describe('Schema Validation', () => {
    it('should validate basic createMessage params', () => {
      const params = {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Hello, world!',
            },
          },
        ],
      };
      
      const result = CreateMessageParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });
    
    it('should validate params with model preferences', () => {
      const params = {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Test message',
            },
          },
        ],
        modelPreferences: {
          hints: [{ name: 'claude-3-sonnet' }],
          intelligencePriority: 0.8,
          speedPriority: 0.5,
          costPriority: 0.3,
        },
        systemPrompt: 'You are a helpful assistant',
        maxTokens: 1000,
      };
      
      const result = CreateMessageParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid message role', () => {
      const params = {
        messages: [
          {
            role: 'invalid',
            content: {
              type: 'text',
              text: 'Test',
            },
          },
        ],
      };
      
      const result = CreateMessageParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
    });
    
    it('should reject invalid priority values', () => {
      const params = {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Test',
            },
          },
        ],
        modelPreferences: {
          intelligencePriority: 1.5, // Invalid: > 1
        },
      };
      
      const result = CreateMessageParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
    });
  });
  
  describe('Context Injection', () => {
    it('should inject file context', () => {
      const messages: any[] = [
        {
          role: 'user',
          content: { type: 'text', text: 'Analyze this code' },
        },
      ];
      
      const result = ContextInjector.injectFileContext(
        messages,
        'test.gd',
        'extends Node\nfunc _ready():\n    pass'
      );
      
      expect(result.length).toBe(2);
      expect(result[0].content.text).toContain('test.gd');
      expect(result[0].content.text).toContain('extends Node');
    });
    
    it('should inject signal context', () => {
      const messages: any[] = [];
      const signals = [
        { name: 'player_died', description: 'Emitted when player health reaches zero' },
        { name: 'game_started', description: 'Emitted when game begins' },
      ];
      
      const result = ContextInjector.injectSignalContext(messages, signals);
      
      expect(result.length).toBe(1);
      expect(result[0].content.text).toContain('player_died');
      expect(result[0].content.text).toContain('game_started');
    });
    
    it('should inject audit context', () => {
      const messages: any[] = [];
      const violations = [
        { rule: 'CTS_FILE_SIZE', message: 'File exceeds 500 lines', file: 'large.gd', line: 1 },
        { rule: 'CTS_TYPE_HINTS', message: 'Missing type hint', file: 'untyped.gd', line: 42 },
      ];
      
      const result = ContextInjector.injectAuditContext(messages, violations);
      
      expect(result.length).toBe(1);
      expect(result[0].content.text).toContain('CTS_FILE_SIZE');
      expect(result[0].content.text).toContain('large.gd');
    });
    
    it('should inject metrics context', () => {
      const messages: any[] = [];
      const metrics = {
        totalFiles: 42,
        totalLines: 5000,
        totalFunctions: 150,
        signalUsage: 75,
        testCoverage: 60,
      };
      
      const result = ContextInjector.injectMetricsContext(messages, metrics);
      
      expect(result.length).toBe(1);
      expect(result[0].content.text).toContain('42');
      expect(result[0].content.text).toContain('5000');
      expect(result[0].content.text).toContain('75%');
    });
  });
  
  describe('SamplingRequestBuilder', () => {
    it('should build basic request', () => {
      const request = new SamplingRequestBuilder()
        .addUserMessage('Hello')
        .build();
      
      expect(request.messages.length).toBe(1);
      expect(request.messages[0].role).toBe('user');
      expect(request.messages[0].content.type).toBe('text');
      if (request.messages[0].content.type === 'text') {
        expect(request.messages[0].content.text).toBe('Hello');
      }
    });
    
    it('should build request with conversation', () => {
      const request = new SamplingRequestBuilder()
        .addUserMessage('What is 2+2?')
        .addAssistantMessage('4')
        .addUserMessage('What is 3+3?')
        .build();
      
      expect(request.messages.length).toBe(3);
      expect(request.messages[0].role).toBe('user');
      expect(request.messages[1].role).toBe('assistant');
      expect(request.messages[2].role).toBe('user');
    });
    
    it('should build request with system prompt', () => {
      const request = new SamplingRequestBuilder()
        .setSystemPrompt('You are a GDScript expert')
        .addUserMessage('Help me')
        .build();
      
      expect(request.systemPrompt).toBe('You are a GDScript expert');
    });
    
    it('should build request with model preferences', () => {
      const request = new SamplingRequestBuilder()
        .addUserMessage('Test')
        .setModelPreferences({
          hints: ['claude-3-sonnet', 'gpt-4'],
          intelligencePriority: 0.9,
          speedPriority: 0.5,
        })
        .build();
      
      expect(request.modelPreferences?.hints).toHaveLength(2);
      expect(request.modelPreferences?.intelligencePriority).toBe(0.9);
    });
    
    it('should build request with parameters', () => {
      const request = new SamplingRequestBuilder()
        .addUserMessage('Test')
        .setMaxTokens(500)
        .setTemperature(0.7)
        .build();
      
      expect(request.maxTokens).toBe(500);
      expect(request.temperature).toBe(0.7);
    });
    
    it('should build request with file context', () => {
      const request = new SamplingRequestBuilder()
        .withFileContext('test.gd', 'extends Node')
        .addUserMessage('Analyze this')
        .build();
      
      expect(request.messages.length).toBe(2);
      if (request.messages[0].content.type === 'text') {
        expect(request.messages[0].content.text).toContain('test.gd');
      }
    });
    
    it('should throw if no messages', () => {
      expect(() => {
        new SamplingRequestBuilder().build();
      }).toThrow('At least one message is required');
    });
  });
  
  describe('SamplingTemplates', () => {
    it('should create refactoring suggestions template', () => {
      const violations = [
        { rule: 'CTS_FILE_SIZE', message: 'Too large', file: 'large.gd', line: 1 },
      ];
      
      const request = SamplingTemplates.refactoringSuggestions(violations);
      
      expect(request.messages.length).toBeGreaterThan(0);
      expect(request.systemPrompt).toContain('GDScript expert');
      expect(request.modelPreferences?.hints?.[0].name).toContain('claude');
    });
    
    it('should create signal naming template', () => {
      const signals = [
        { name: 'on_death', description: 'Player died' },
      ];
      
      const request = SamplingTemplates.signalNaming(signals);
      
      expect(request.messages.length).toBeGreaterThan(0);
      expect(request.systemPrompt).toContain('event-driven');
    });
    
    it('should create code explanation template', () => {
      const request = SamplingTemplates.codeExplanation(
        'test.gd',
        'func test(): pass'
      );
      
      expect(request.messages.length).toBeGreaterThan(0);
      if (request.messages[0].content.type === 'text') {
        expect(request.messages[0].content.text).toContain('test.gd');
      }
    });
  });
  
  describe('Message Format Compliance', () => {
    it('should create spec-compliant message structure', () => {
      const request = new SamplingRequestBuilder()
        .addUserMessage('Test')
        .setSystemPrompt('System')
        .setModelPreferences({
          hints: ['claude-3-sonnet'],
          intelligencePriority: 0.8,
          speedPriority: 0.5,
        })
        .setMaxTokens(100)
        .build();
      
      // Validate against schema
      const result = CreateMessageParamsSchema.safeParse(request);
      expect(result.success).toBe(true);
      
      // Check structure matches spec
      expect(request.messages[0]).toHaveProperty('role');
      expect(request.messages[0]).toHaveProperty('content');
      expect(request.messages[0].content).toHaveProperty('type');
      expect(request.messages[0].content).toHaveProperty('text');
    });
    
    it('should support image content type', () => {
      const params = {
        messages: [
          {
            role: 'user',
            content: {
              type: 'image',
              data: 'base64data',
              mimeType: 'image/png',
            },
          },
        ],
      };
      
      const result = CreateMessageParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });
  });
});
