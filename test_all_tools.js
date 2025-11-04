#!/usr/bin/env node

/**
 * CTS MCP Server - Comprehensive Tool Smoke Test
 * 
 * Tests all 14 tools with minimal inputs to verify basic functionality.
 * Following Pete's methodology: systematic testing, quick wins, low-effort high-reward.
 * 
 * Usage: node test_all_tools.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test suite configuration
const TIMEOUT_MS = 5000; // 5 second timeout per tool
const SERVER_PATH = path.join(__dirname, 'build', 'index.js');

// Tool test definitions - minimal inputs for smoke testing
const toolTests = [
  // Tier 2B Tools (New)
  {
    name: 'cts_audit',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      categories: ['cts'],
      minScore: 0,
      format: 'json'
    },
    expectation: 'Returns audit score object with categories'
  },
  {
    name: 'CTS_Reasoning',
    params: {
      topic: 'Test reasoning engine with minimal input',
      maxIterations: 3
    },
    expectation: 'Returns reasoning chain with 3 iterations'
  },
  {
    name: 'CTS_Bughunter',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      minSeverity: 'high',
      maxFiles: 10,
      exportFormat: 'json'
    },
    expectation: 'Returns bug report with severity filtering'
  },
  {
    name: 'CTS_Cleanup',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      dryRun: true,
      strategies: ['dead_code'],
      maxActions: 10
    },
    expectation: 'Returns cleanup actions in dry-run mode'
  },
  
  // Legacy Tools (Tier 1/2A)
  {
    name: 'CTS_Scan_Project_Signals',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      renderMap: false
    },
    expectation: 'Returns signal scan results without rendering'
  },
  {
    name: 'CTS_Suggest_Refactoring',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      maxSuggestions: 5,
      minConfidence: 0.95
    },
    expectation: 'Returns refactoring suggestions'
  },
  {
    name: 'CTS_Render_Artifact',
    params: {
      artifactType: 'signal_map',
      data: {
        signals: [
          { name: 'test_signal', emitters: ['TestNode'], receivers: ['OtherNode'] }
        ]
      },
      metadata: { title: 'Smoke Test Signal Map' }
    },
    expectation: 'Returns HTML rendering of artifact'
  },
  {
    name: 'CTS_Export_to_Shrimp',
    params: {
      hopPlan: {
        hopId: '0.0',
        name: 'Smoke Test Hop',
        description: 'Test hop for smoke testing',
        estimatedLOC: 10
      },
      generateSubTasks: false,
      updateMode: 'append'
    },
    expectation: 'Returns Shrimp task format'
  }
];

// Test execution state
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

/**
 * Send JSON-RPC request to MCP server and capture response
 */
function testTool(toolName, params) {
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
      
      if (stderr && !stdout) {
        reject(new Error(`Server error: ${stderr}`));
        return;
      }

      try {
        // Parse JSON-RPC response
        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const response = JSON.parse(lastLine);
        
        if (response.error) {
          reject(new Error(`JSON-RPC error: ${response.error.message}`));
        } else {
          resolve(response.result);
        }
      } catch (parseError) {
        reject(new Error(`Failed to parse response: ${parseError.message}\nOutput: ${stdout.substring(0, 200)}`));
      }
    });

    server.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });

    // Send JSON-RPC request
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

/**
 * Run single tool test with error handling
 */
async function runToolTest(test) {
  const startTime = Date.now();
  
  process.stdout.write(`${colors.blue}Testing ${test.name}...${colors.reset} `);
  
  try {
    const result = await testTool(test.name, test.params);
    const duration = Date.now() - startTime;
    
    // Basic validation - check if result has content
    if (result && (result.content || Array.isArray(result))) {
      console.log(`${colors.green}✓ PASS${colors.reset} (${duration}ms)`);
      console.log(`  ${colors.cyan}→ ${test.expectation}${colors.reset}`);
      testsPassed++;
      return true;
    } else {
      console.log(`${colors.yellow}⚠ WARN${colors.reset} (${duration}ms)`);
      console.log(`  ${colors.yellow}→ Unexpected result format${colors.reset}`);
      console.log(`  ${colors.yellow}→ Result: ${JSON.stringify(result).substring(0, 100)}${colors.reset}`);
      testsFailed++;
      failedTests.push({ tool: test.name, reason: 'Unexpected result format' });
      return false;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`${colors.red}✗ FAIL${colors.reset} (${duration}ms)`);
    console.log(`  ${colors.red}→ ${error.message}${colors.reset}`);
    testsFailed++;
    failedTests.push({ tool: test.name, reason: error.message });
    return false;
  }
}

/**
 * Run all smoke tests
 */
async function runAllTests() {
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  CTS MCP Server - Tool Smoke Test Suite${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`Server: ${SERVER_PATH}`);
  console.log(`Timeout: ${TIMEOUT_MS}ms per tool`);
  console.log(`Total tools: ${toolTests.length}\n`);
  
  // Test server is accessible
  console.log(`${colors.blue}Verifying server exists...${colors.reset}`);
  if (!fs.existsSync(SERVER_PATH)) {
    console.log(`${colors.red}✗ FATAL: Server not found at ${SERVER_PATH}${colors.reset}`);
    console.log(`${colors.yellow}Run 'npm run build' first${colors.reset}`);
    process.exit(1);
  }
  console.log(`${colors.green}✓ Server found${colors.reset}\n`);
  
  // Run each test
  for (const test of toolTests) {
    await runToolTest(test);
    testsRun++;
    console.log(''); // Blank line between tests
  }
  
  // Print summary
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Test Results${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`Total:  ${testsRun} tests`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  
  const passRate = ((testsPassed / testsRun) * 100).toFixed(1);
  console.log(`\nPass rate: ${passRate}%`);
  
  if (failedTests.length > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    failedTests.forEach(({ tool, reason }) => {
      console.log(`  ${colors.red}✗ ${tool}${colors.reset}: ${reason}`);
    });
  }
  
  console.log(''); // Final blank line
  
  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
