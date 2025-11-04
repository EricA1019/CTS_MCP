#!/usr/bin/env node

/**
 * CTS MCP Server - Response Inspector
 * 
 * Captures and pretty-prints tool responses to diagnose schema issues.
 * Shows exactly what each tool returns vs what it should return.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_PATH = path.join(__dirname, 'build', 'index.js');

async function inspectTool(toolName, params) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    server.stdout.on('data', (data) => stdout += data.toString());
    server.stderr.on('data', (data) => stderr += data.toString());

    server.on('close', () => {
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.jsonrpc === '2.0' && 'id' in parsed) {
            resolve({ response: parsed, stderr });
            return;
          }
        } catch (e) {
          continue;
        }
      }
      reject(new Error('No JSON-RPC response found'));
    });

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: toolName, arguments: params }
    };

    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

// Inspect the failing tools
const toolsToInspect = [
  {
    name: 'CTS_Bughunter',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      minSeverity: 'medium',
      maxFiles: 5,
      exportFormat: 'json'
    }
  },
  {
    name: 'CTS_Export_to_Shrimp',
    params: {
      hopPlan: {
        hopId: '99.9',
        name: 'Test Hop',
        description: 'Test',
        estimatedLOC: 42
      },
      generateSubTasks: false,
      updateMode: 'append'
    }
  }
];

console.log('═══════════════════════════════════════════════════');
console.log('  CTS MCP Response Inspector');
console.log('═══════════════════════════════════════════════════\n');

for (const tool of toolsToInspect) {
  console.log(`\n━━━ ${tool.name} ━━━\n`);
  
  try {
    const { response } = await inspectTool(tool.name, tool.params);
    
    if (response.result && response.result.content) {
      const content = response.result.content[0];
      console.log('Response Type:', content.type);
      console.log('\nActual Response Data:\n');
      
      try {
        const data = JSON.parse(content.text);
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        console.log(content.text.substring(0, 500));
      }
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}
