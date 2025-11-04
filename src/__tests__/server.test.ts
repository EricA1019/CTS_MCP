import { describe, test, expect, beforeEach } from '@jest/globals';
import { CTSMCPServer } from '../server';
import type { MCPRequest } from '../types';

describe('CTSMCPServer - Unit Tests', () => {
  let server: CTSMCPServer;

  beforeEach(() => {
    server = new CTSMCPServer();
  });

  describe('Server Initialization', () => {
    test('should initialize successfully', () => {
      expect(server).toBeDefined();
      expect(server).toBeInstanceOf(CTSMCPServer);
    });

    test('should have correct server info', () => {
      const serverInfo = (server as any).serverInfo;
      expect(serverInfo.name).toBe('cts-mcp-server');
      expect(serverInfo.version).toBe('1.0.0');
    });

    test('should register tools on construction', () => {
      const tools = (server as any).tools;
      expect(tools.size).toBeGreaterThan(0);
    });
  });

  describe('MCP Protocol Handling', () => {
    test('should handle initialize request', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '0.1.0',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      };

      const response = await server.handleMessage(request);
      
      expect(response).toHaveProperty('id', 1);
      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('protocolVersion');
      expect(response.result).toHaveProperty('serverInfo');
      expect((response.result as any).serverInfo.name).toBe('cts-mcp-server');
    });

    test('should handle tools/list request', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };

      const response = await server.handleMessage(request);
      
      expect(response).toHaveProperty('id', 2);
      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('tools');
      expect(Array.isArray((response.result as any).tools)).toBe(true);
      expect((response.result as any).tools.length).toBeGreaterThan(0);
    });

    test('should list all registered tools', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/list',
        params: {}
      };

      const response = await server.handleMessage(request);
      const tools = (response.result as any).tools;

      const toolNames = tools.map((t: any) => t.name);
      expect(toolNames).toContain('CTS_Export_to_Shrimp');
      expect(toolNames).toContain('CTS_Render_Artifact');
      expect(toolNames).toContain('CTS_Scan_Project_Signals');
    });

    test('should handle invalid method gracefully', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 4,
        method: 'invalid/method',
        params: {}
      };

      const response = await server.handleMessage(request);
      
      expect(response).toHaveProperty('id', 4);
      expect(response).toHaveProperty('error');
      expect(response.error).toHaveProperty('code');
      expect(response.error).toHaveProperty('message');
    });

    test('should handle malformed request', async () => {
      const request = {
        jsonrpc: '2.0',
        // Missing id and method
        params: {}
      } as any;

      const response = await server.handleMessage(request);
      
      expect(response).toHaveProperty('error');
    });
  });

  describe('Tool Routing', () => {
    test('should route CTS_Export_to_Shrimp tool', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'CTS_Export_to_Shrimp',
          arguments: {
            hopPlanJson: JSON.stringify({
              phases: [{
                name: 'Test Phase',
                hops: [{
                  id: '1.1',
                  name: 'Test Hop',
                  description: 'Test description',
                  estimatedLOC: 100,
                  dependencies: []
                }]
              }]
            })
          }
        }
      };

      const response = await server.handleMessage(request);
      
      expect(response).toHaveProperty('id', 5);
      // May have error if Shrimp not running, but should route correctly
      expect(response).toHaveProperty('result');
    });

    test('should route CTS_Render_Artifact tool', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'CTS_Render_Artifact',
          arguments: {
            artifactType: 'hop_dashboard',
            data: JSON.stringify({
              phases: [],
              statistics: {
                totalLOC: 0,
                plannedLOC: 0,
                complianceRate: 100,
                completionRate: 0
              }
            })
          }
        }
      };

      const response = await server.handleMessage(request);
      
      expect(response).toHaveProperty('id', 6);
      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('content');
    });

    test('should handle unknown tool name', async () => {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: {
          name: 'Unknown_Tool',
          arguments: {}
        }
      };

      const response = await server.handleMessage(request);
      
      expect(response).toHaveProperty('id', 7);
      expect(response).toHaveProperty('error');
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('not found');
    });
  });

  describe('Performance', () => {
    test('should start in under 2 seconds', async () => {
      const start = Date.now();
      
      const newServer = new CTSMCPServer();
      await newServer.handleMessage({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '0.1.0',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' }
        }
      });
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });

    test('should handle multiple requests concurrently', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        jsonrpc: '2.0' as const,
        id: i,
        method: 'tools/list',
        params: {}
      }));

      const start = Date.now();
      const responses = await Promise.all(
        requests.map(req => server.handleMessage(req))
      );
      const elapsed = Date.now() - start;

      expect(responses).toHaveLength(10);
      responses.forEach((res: any, i: number) => {
        expect(res).toHaveProperty('id', i);
        expect(res).toHaveProperty('result');
      });
      expect(elapsed).toBeLessThan(500); // All 10 requests under 500ms
    });
  });
});
