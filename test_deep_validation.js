#!/usr/bin/env node

/**
 * CTS MCP Server - Deep Validation Test Suite
 * 
 * Based on MCP testing best practices from:
 * - Specmatic MCP Auto-Test (schema drift detection)
 * - MCP Inspector methodology (tool response validation)
 * - MCP Protocol Specification (JSON-RPC compliance)
 * 
 * Validates:
 * 1. Response schema correctness (not just presence)
 * 2. Content structure and data types
 * 3. Error handling and edge cases
 * 4. Protocol compliance (JSON-RPC 2.0)
 * 
 * Following Pete's methodology: systematic testing, expose false positives
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const TIMEOUT_MS = 10000; // 10 seconds for complex operations
const SERVER_PATH = path.join(__dirname, 'build', 'index.js');

// Deep validation test suite with schema checking
const deepTests = [
  {
    name: 'CTS_Reasoning',
    params: {
      topic: 'Test reasoning with specific validation requirements',
      context: 'Validate that reasoning chain has proper structure',
      maxIterations: 3
    },
    validate: (result) => {
      // Check result structure
      if (!result || !result.content || !Array.isArray(result.content)) {
        return { valid: false, reason: 'Missing or invalid content array' };
      }
      
      const content = result.content[0];
      if (!content || content.type !== 'text') {
        return { valid: false, reason: 'Content type must be "text"' };
      }
      
      // Parse the text content as JSON
      let data;
      try {
        data = JSON.parse(content.text);
      } catch (e) {
        return { valid: false, reason: `Content.text is not valid JSON: ${e.message}` };
      }
      
      // Validate reasoning chain structure
      if (!data.reasoning_chain || !Array.isArray(data.reasoning_chain)) {
        return { valid: false, reason: 'Missing reasoning_chain array' };
      }
      
      if (data.reasoning_chain.length !== 3) {
        return { valid: false, reason: `Expected 3 iterations, got ${data.reasoning_chain.length}` };
      }
      
      // Validate each iteration has required fields
      for (let i = 0; i < data.reasoning_chain.length; i++) {
        const iteration = data.reasoning_chain[i];
        const requiredFields = ['iteration', 'stage', 'thought', 'next_thought_needed'];
        
        for (const field of requiredFields) {
          if (!(field in iteration)) {
            return { valid: false, reason: `Iteration ${i + 1} missing field: ${field}` };
          }
        }
        
        if (iteration.iteration !== i + 1) {
          return { valid: false, reason: `Iteration ${i + 1} has incorrect iteration number: ${iteration.iteration}` };
        }
      }
      
      return { valid: true, details: `Validated ${data.reasoning_chain.length} reasoning iterations` };
    }
  },
  
  {
    name: 'CTS_Bughunter',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      minSeverity: 'medium',
      maxFiles: 5,
      exportFormat: 'json'
    },
    validate: (result) => {
      if (!result || !result.content || !Array.isArray(result.content)) {
        return { valid: false, reason: 'Missing or invalid content array' };
      }
      
      const content = result.content[0];
      if (!content || content.type !== 'text') {
        return { valid: false, reason: 'Content type must be "text"' };
      }
      
      let data;
      try {
        data = JSON.parse(content.text);
      } catch (e) {
        return { valid: false, reason: `Content.text is not valid JSON: ${e.message}` };
      }
      
      // Validate bug report structure
      const requiredFields = ['summary', 'bugs', 'scanned_files'];
      for (const field of requiredFields) {
        if (!(field in data)) {
          return { valid: false, reason: `Missing required field: ${field}` };
        }
      }
      
      if (!Array.isArray(data.bugs)) {
        return { valid: false, reason: 'bugs must be an array' };
      }
      
      if (typeof data.scanned_files !== 'number') {
        return { valid: false, reason: 'scanned_files must be a number' };
      }
      
      // Validate bug entries
      for (const bug of data.bugs) {
        const bugFields = ['severity', 'pattern', 'file'];
        for (const field of bugFields) {
          if (!(field in bug)) {
            return { valid: false, reason: `Bug entry missing field: ${field}` };
          }
        }
        
        const validSeverities = ['low', 'medium', 'high', 'critical'];
        if (!validSeverities.includes(bug.severity)) {
          return { valid: false, reason: `Invalid severity: ${bug.severity}` };
        }
      }
      
      return { valid: true, details: `Found ${data.bugs.length} bugs in ${data.scanned_files} files` };
    }
  },
  
  {
    name: 'CTS_Render_Artifact',
    params: {
      artifactType: 'signal_map',
      data: {
        signals: [
          { name: 'player_moved', emitters: ['Player'], receivers: ['Camera', 'UI'] },
          { name: 'game_started', emitters: ['GameManager'], receivers: ['Player', 'UI'] }
        ]
      },
      metadata: { title: 'Deep Validation Test Signal Map' }
    },
    validate: (result) => {
      if (!result || !result.content || !Array.isArray(result.content)) {
        return { valid: false, reason: 'Missing or invalid content array' };
      }
      
      const content = result.content[0];
      if (!content || content.type !== 'text') {
        return { valid: false, reason: 'Content type must be "text"' };
      }
      
      const html = content.text;
      
      // Validate HTML structure
      if (!html.includes('<!DOCTYPE html>')) {
        return { valid: false, reason: 'Missing DOCTYPE declaration' };
      }
      
      if (!html.includes('<html')) {
        return { valid: false, reason: 'Missing HTML tag' };
      }
      
      // Validate signal map specific content
      if (!html.includes('player_moved')) {
        return { valid: false, reason: 'Signal "player_moved" not found in rendered HTML' };
      }
      
      if (!html.includes('game_started')) {
        return { valid: false, reason: 'Signal "game_started" not found in rendered HTML' };
      }
      
      if (!html.includes('Deep Validation Test Signal Map')) {
        return { valid: false, reason: 'Metadata title not found in rendered HTML' };
      }
      
      // Check for visualization libraries (D3.js expected)
      if (!html.includes('d3.js') && !html.includes('d3.min.js')) {
        return { valid: false, reason: 'D3.js library not included in HTML' };
      }
      
      return { valid: true, details: `Valid HTML signal map with 2 signals rendered` };
    }
  },
  
  {
    name: 'CTS_Export_to_Shrimp',
    params: {
      hopPlan: {
        hopId: '99.9',
        name: 'Deep Validation Test Hop',
        description: 'Test hop with all required fields for validation',
        estimatedLOC: 42,
        acceptanceCriteria: ['Test passes', 'Schema validates'],
        deliverables: ['Test results', 'Validation report'],
        dependencies: [],
        technicalNotes: 'Testing Shrimp export format'
      },
      generateSubTasks: false,
      updateMode: 'append'
    },
    validate: (result) => {
      if (!result || !result.content || !Array.isArray(result.content)) {
        return { valid: false, reason: 'Missing or invalid content array' };
      }
      
      const content = result.content[0];
      if (!content || content.type !== 'text') {
        return { valid: false, reason: 'Content type must be "text"' };
      }
      
      let data;
      try {
        data = JSON.parse(content.text);
      } catch (e) {
        return { valid: false, reason: `Content.text is not valid JSON: ${e.message}` };
      }
      
      // Validate Shrimp task format
      if (!data.updateMode) {
        return { valid: false, reason: 'Missing updateMode field' };
      }
      
      if (!data.hopPlan) {
        return { valid: false, reason: 'Missing hopPlan field' };
      }
      
      const hop = data.hopPlan;
      const requiredHopFields = ['hopId', 'name', 'description', 'estimatedLOC'];
      for (const field of requiredHopFields) {
        if (!(field in hop)) {
          return { valid: false, reason: `hopPlan missing field: ${field}` };
        }
      }
      
      if (hop.hopId !== '99.9') {
        return { valid: false, reason: `hopId mismatch: expected "99.9", got "${hop.hopId}"` };
      }
      
      if (hop.estimatedLOC !== 42) {
        return { valid: false, reason: `estimatedLOC mismatch: expected 42, got ${hop.estimatedLOC}` };
      }
      
      return { valid: true, details: `Valid Shrimp task format for hop ${hop.hopId}` };
    }
  }
];

// Test execution
async function testTool(toolName, params) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);

    const server = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    server.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    server.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    server.on('close', (code) => {
      clearTimeout(timeoutId);
      
      try {
        // Find JSON-RPC response (ignore stderr logs)
        const lines = stdout.trim().split('\n');
        let response = null;
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.jsonrpc === '2.0' && 'id' in parsed) {
              response = parsed;
              break;
            }
          } catch (e) {
            // Skip non-JSON lines
            continue;
          }
        }
        
        if (!response) {
          reject(new Error(`No valid JSON-RPC response found in output`));
          return;
        }
        
        if (response.error) {
          reject(new Error(`JSON-RPC error: ${response.error.message}`));
        } else {
          resolve(response.result);
        }
      } catch (parseError) {
        reject(new Error(`Failed to parse response: ${parseError.message}`));
      }
    });

    server.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params
      }
    };

    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

async function runDeepTest(test) {
  const startTime = Date.now();
  
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}Testing: ${test.name}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  try {
    // Execute tool
    process.stdout.write(`${colors.yellow}⏳ Executing...${colors.reset} `);
    const result = await testTool(test.name, test.params);
    const duration = Date.now() - startTime;
    console.log(`${colors.green}✓${colors.reset} (${duration}ms)\n`);
    
    // Validate result
    process.stdout.write(`${colors.yellow}⏳ Validating schema...${colors.reset} `);
    const validation = test.validate(result);
    
    if (validation.valid) {
      console.log(`${colors.green}✓ PASS${colors.reset}`);
      console.log(`${colors.cyan}  Details: ${validation.details}${colors.reset}`);
      return { passed: true, tool: test.name, duration };
    } else {
      console.log(`${colors.red}✗ FAIL${colors.reset}`);
      console.log(`${colors.red}  Reason: ${validation.reason}${colors.reset}`);
      console.log(`${colors.yellow}  This is a FALSE POSITIVE - tool responded but schema is invalid${colors.reset}`);
      return { passed: false, tool: test.name, duration, reason: validation.reason };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`${colors.red}✗ FAIL${colors.reset} (${duration}ms)`);
    console.log(`${colors.red}  Error: ${error.message}${colors.reset}`);
    return { passed: false, tool: test.name, duration, reason: error.message };
  }
}

async function runAllDeepTests() {
  console.log(`${colors.magenta}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}  CTS MCP Server - Deep Validation Test Suite${colors.reset}`);
  console.log(`${colors.magenta}  Based on Specmatic MCP Auto-Test & MCP Inspector${colors.reset}`);
  console.log(`${colors.magenta}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.cyan}Server:${colors.reset} ${SERVER_PATH}`);
  console.log(`${colors.cyan}Timeout:${colors.reset} ${TIMEOUT_MS}ms per tool`);
  console.log(`${colors.cyan}Tests:${colors.reset} ${deepTests.length} tools with schema validation`);
  
  // Verify server exists
  if (!fs.existsSync(SERVER_PATH)) {
    console.log(`\n${colors.red}✗ FATAL: Server not found at ${SERVER_PATH}${colors.reset}`);
    console.log(`${colors.yellow}Run 'npm run build' first${colors.reset}`);
    process.exit(1);
  }
  
  const results = [];
  for (const test of deepTests) {
    const result = await runDeepTest(test);
    results.push(result);
  }
  
  // Summary
  console.log(`\n${colors.magenta}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}  Test Results Summary${colors.reset}`);
  console.log(`${colors.magenta}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const passRate = ((passed / results.length) * 100).toFixed(1);
  
  console.log(`${colors.cyan}Total:${colors.reset}  ${results.length} tests`);
  console.log(`${colors.green}Passed:${colors.reset} ${passed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${failed}`);
  console.log(`${colors.yellow}Pass Rate:${colors.reset} ${passRate}%\n`);
  
  if (failed > 0) {
    console.log(`${colors.red}Failed Tests (with reasons):${colors.reset}`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ${colors.red}✗ ${r.tool}${colors.reset}`);
      console.log(`    ${colors.yellow}→ ${r.reason}${colors.reset}`);
    });
    console.log('');
  }
  
  // Average execution time
  const avgTime = (results.reduce((sum, r) => sum + r.duration, 0) / results.length).toFixed(0);
  console.log(`${colors.cyan}Average execution time:${colors.reset} ${avgTime}ms\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runAllDeepTests().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
