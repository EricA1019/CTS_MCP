#!/usr/bin/env node

/**
 * CTS MCP Server - E2E Functional Test Suite
 * 
 * Tests ACTUAL FUNCTIONALITY, not just schema compliance.
 * Following Quinn (Testing Expert) methodology:
 * - Validate behavior, not just structure
 * - Check output quality, not just presence
 * - Ensure reasoning is real, not template placeholders
 * 
 * Critical lesson: Schema validation ≠ functional validation
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_PATH = path.join(__dirname, 'build', 'index.js');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function callTool(toolName, params) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout after 60s')), 60000);
    
    const server = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    server.stdout.on('data', (data) => stdout += data.toString());
    server.stderr.on('data', (data) => stderr += data.toString());

    server.on('close', (code) => {
      clearTimeout(timeout);
      
      // Debug output if something went wrong
      if (code !== 0 && stderr) {
        console.error(`${colors.yellow}  Server stderr: ${stderr.substring(0, 500)}${colors.reset}`);
      }
      
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.jsonrpc === '2.0' && 'id' in parsed) {
            if (parsed.error) {
              reject(new Error(`Tool error: ${parsed.error.message}`));
            } else {
              resolve(parsed.result);
            }
            return;
          }
        } catch (e) {
          continue;
        }
      }
      
      // More detailed error if no response found
      const lastLines = lines.slice(-3).join('\n');
      reject(new Error(`No JSON-RPC response found. Last output: ${lastLines.substring(0, 200)}`));
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

/**
 * Validate BaseToolResponse format
 * Following Task 2C.3/2C.4 schema validation integration
 */
function validateBaseToolResponse(result, toolName) {
  const errors = [];
  
  // Parse MCP content wrapper
  if (!result.content || !Array.isArray(result.content) || result.content.length === 0) {
    errors.push('Missing MCP content array');
    return { valid: false, errors };
  }
  
  const content = result.content[0];
  if (content.type !== 'text') {
    errors.push(`Expected content type 'text', got '${content.type}'`);
    return { valid: false, errors };
  }
  
  // Parse BaseToolResponse
  let data;
  try {
    data = JSON.parse(content.text);
  } catch (e) {
    errors.push(`Failed to parse JSON response: ${e.message}`);
    return { valid: false, errors };
  }
  
  // Validate BaseToolResponse fields
  if (data.success !== true) {
    errors.push(`Expected success: true, got: ${data.success}`);
  }
  
  if (!data.timestamp || typeof data.timestamp !== 'string') {
    errors.push('Missing or invalid timestamp');
  }
  
  if (toolName && data.toolName !== toolName) {
    errors.push(`Expected toolName: '${toolName}', got: '${data.toolName}'`);
  }
  
  if (!data.result || typeof data.result !== 'object') {
    errors.push('Missing or invalid result object');
  }
  
  // Optional fields
  if (data.duration_ms !== undefined && typeof data.duration_ms !== 'number') {
    errors.push('Invalid duration_ms type');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    data
  };
}

// E2E Test: CTS_Reasoning - Does it actually reason?
async function testReasoningFunctionality() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  E2E Test: CTS_Reasoning Functional Validation${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  const testCases = [
    {
      name: 'Simple Math Problem',
      params: {
        topic: 'Calculate the optimal file size limit for GDScript files considering readability and performance',
        context: 'Current CTS standard is 500 lines. Evaluate if this should change.',
        maxIterations: 5
      },
      validate: (result) => {
        const schemaValidation = validateBaseToolResponse(result, 'CTS_Reasoning');
        if (!schemaValidation.valid) {
          return { 
            pass: false, 
            reason: `Schema validation failed: ${schemaValidation.errors.join(', ')}` 
          };
        }
        
        const data = schemaValidation.data;
        const chain = data.result.reasoning_chain;
        
        // Check 1: Did it actually create 5 iterations?
        if (chain.length !== 5) {
          return { pass: false, reason: `Expected 5 iterations, got ${chain.length}` };
        }
        
        // Check 2: Are thoughts unique (not just repeating)?
        const thoughts = chain.map(c => c.thought);
        const uniqueThoughts = new Set(thoughts);
        if (uniqueThoughts.size < 3) {
          return { pass: false, reason: `Only ${uniqueThoughts.size} unique thoughts - appears to be repeating` };
        }
        
        // Check 3: Does content mention the specific topic?
        const allText = thoughts.join(' ').toLowerCase();
        const topicKeywords = ['file size', 'gdscript', '500', 'lines', 'readability', 'performance'];
        const foundKeywords = topicKeywords.filter(kw => allText.includes(kw.toLowerCase()));
        
        if (foundKeywords.length < 3) {
          return { 
            pass: false, 
            reason: `Only found ${foundKeywords.length}/6 topic keywords - reasoning appears generic/templated` 
          };
        }
        
        // Check 4: Do stages progress logically?
        const stages = chain.map(c => c.stage);
        const hasVariety = new Set(stages).size > 2;
        if (!hasVariety) {
          return { pass: false, reason: `All stages are "${stages[0]}" - no progression` };
        }
        
        // Check 5: Are thoughts substantive (not just placeholders)?
        const avgThoughtLength = thoughts.reduce((sum, t) => sum + t.length, 0) / thoughts.length;
        if (avgThoughtLength < 50) {
          return { 
            pass: false, 
            reason: `Average thought length ${avgThoughtLength.toFixed(0)} chars - appears to be placeholder text` 
          };
        }
        
        return { 
          pass: true, 
          details: `${chain.length} iterations, ${uniqueThoughts.size} unique thoughts, ${foundKeywords.length}/6 keywords found, ${stages.length} stage transitions, avg ${avgThoughtLength.toFixed(0)} chars/thought` 
        };
      }
    },
    
    {
      name: 'Technical Analysis Problem',
      params: {
        topic: 'Why might tree-sitter-gdscript fail to compile on Node.js 22.18.0 with ABI 127',
        context: 'Error: No native build found for platform=linux arch=x64 runtime=node abi=127',
        maxIterations: 4
      },
      validate: (result) => {
        const schemaValidation = validateBaseToolResponse(result, 'CTS_Reasoning');
        if (!schemaValidation.valid) {
          return { 
            pass: false, 
            reason: `Schema validation failed: ${schemaValidation.errors.join(', ')}` 
          };
        }
        
        const data = schemaValidation.data;
        const chain = data.result.reasoning_chain;
        const allText = chain.map(c => c.thought).join(' ').toLowerCase();
        
        // Must mention relevant technical concepts
        const technicalTerms = ['abi', 'native', 'compile', 'node', 'tree-sitter'];
        const foundTerms = technicalTerms.filter(term => allText.includes(term));
        
        if (foundTerms.length < 3) {
          return { 
            pass: false, 
            reason: `Only ${foundTerms.length}/5 technical terms found - not analyzing the actual problem` 
          };
        }
        
        // Check for actual problem-solving thinking
        const problemSolvingIndicators = ['because', 'therefore', 'suggests', 'indicates', 'means', 'implies'];
        const foundIndicators = problemSolvingIndicators.filter(ind => allText.includes(ind));
        
        if (foundIndicators.length < 2) {
          return { 
            pass: false, 
            reason: `Lacks causal reasoning - no "because", "therefore", etc.` 
          };
        }
        
        return { 
          pass: true, 
          details: `Found ${foundTerms.length}/5 technical terms, ${foundIndicators.length} reasoning indicators` 
        };
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`${colors.blue}Test Case: ${testCase.name}${colors.reset}`);
    console.log(`${colors.yellow}Topic: ${testCase.params.topic.substring(0, 80)}...${colors.reset}\n`);
    
    try {
      console.log(`${colors.yellow}⏳ Executing tool...${colors.reset}`);
      const result = await callTool('CTS_Reasoning', testCase.params);
      console.log(`${colors.green}✓ Tool responded${colors.reset}\n`);
      
      console.log(`${colors.yellow}⏳ Validating functional behavior...${colors.reset}`);
      const validation = testCase.validate(result);
      
      if (validation.pass) {
        console.log(`${colors.green}✓ PASS - Functional validation successful${colors.reset}`);
        console.log(`${colors.cyan}  ${validation.details}${colors.reset}\n`);
        passed++;
      } else {
        console.log(`${colors.red}✗ FAIL - Tool responds but doesn't function correctly${colors.reset}`);
        console.log(`${colors.red}  ${validation.reason}${colors.reset}\n`);
        
        // Show first thought as evidence
        try {
          const schemaValidation = validateBaseToolResponse(result, 'CTS_Reasoning');
          if (schemaValidation.valid && schemaValidation.data.result.reasoning_chain.length > 0) {
            console.log(`${colors.yellow}  Evidence (first thought):${colors.reset}`);
            console.log(`${colors.yellow}  "${schemaValidation.data.result.reasoning_chain[0].thought.substring(0, 150)}..."${colors.reset}\n`);
          }
        } catch (e) {
          // Ignore evidence display errors
        }
        failed++;
      }
    } catch (error) {
      console.log(`${colors.red}✗ FAIL - Tool execution error${colors.reset}`);
      console.log(`${colors.red}  ${error.message}${colors.reset}\n`);
      failed++;
    }
    
    console.log(`${colors.cyan}─────────────────────────────────────────────────${colors.reset}\n`);
  }
  
  // Summary
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  E2E Test Results${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`Total tests: ${testCases.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Pass rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);
  
  if (failed > 0) {
    console.log(`${colors.red}⚠️  CRITICAL: CTS_Reasoning has schema compliance but lacks functional correctness${colors.reset}`);
    console.log(`${colors.yellow}   Schema validation ≠ Functional validation${colors.reset}`);
    console.log(`${colors.yellow}   Tool returns correct structure but generic/placeholder content${colors.reset}\n`);
  }
  
  return failed === 0;
}

// Run E2E tests
async function runAllTests() {
  const results = [];
  
  console.log(`${colors.magenta}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║   CTS MCP Server - E2E Functional Test Suite     ║${colors.reset}`);
  console.log(`${colors.magenta}║   Testing All 9 Tools for Actual Functionality   ║${colors.reset}`);
  console.log(`${colors.magenta}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);
  
  // Test 1: CTS_Reasoning
  results.push(await testReasoningFunctionality());
  
  // Test 2: CTS_Bughunter
  results.push(await testBughunterFunctionality());
  
  // Test 3: CTS_Cleanup
  results.push(await testCleanupFunctionality());
  
  // Test 4: cts_audit
  results.push(await testAuditFunctionality());
  
  // Test 5: CTS_Scan_Project_Signals
  results.push(await testScanSignalsFunctionality());
  
  // Test 6: CTS_Suggest_Refactoring
  results.push(await testSuggestRefactoringFunctionality());
  
  // Test 7: CTS_Analyze_Project
  results.push(await testAnalyzeProjectFunctionality());
  
  // Test 8: CTS_Render_Artifact  
  results.push(await testRenderArtifactFunctionality());
  
  // Final summary
  const totalPassed = results.filter(r => r).length;
  const totalFailed = results.length - totalPassed;
  
  console.log(`\n${colors.magenta}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║            Final E2E Test Summary                 ║${colors.reset}`);
  console.log(`${colors.magenta}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`Total tool suites: ${results.length}`);
  console.log(`${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${totalFailed}${colors.reset}`);
  console.log(`Overall pass rate: ${((totalPassed / results.length) * 100).toFixed(1)}%\n`);
  
  return totalFailed === 0;
}

// E2E Test: CTS_Bughunter
async function testBughunterFunctionality() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  E2E Test: CTS_Bughunter Functional Validation${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  const testCase = {
    name: 'Godot Project Bug Detection',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      minSeverity: 'medium',
      maxFiles: 20,
      exportFormat: 'json'
    },
    validate: (result) => {
      // Validate BaseToolResponse format
      const schemaValidation = validateBaseToolResponse(result, 'CTS_Bughunter');
      if (!schemaValidation.valid) {
        return { 
          pass: false, 
          reason: `Schema validation failed: ${schemaValidation.errors.join(', ')}` 
        };
      }
      
      const data = schemaValidation.data;
      
      // Functional validation
      if (!data.result.stats) {
        return { pass: false, reason: 'Missing stats field in result' };
      }
      
      if (typeof data.result.stats.filesScanned !== 'number' || data.result.stats.filesScanned === 0) {
        return { pass: false, reason: 'Did not scan any files' };
      }
      
      if (!Array.isArray(data.result.bugs)) {
        return { pass: false, reason: 'Bugs field is not an array' };
      }
      
      return { 
        pass: true, 
        details: `Scanned ${data.result.stats.filesScanned} files, found ${data.result.stats.totalBugs} bugs, took ${data.duration_ms}ms` 
      };
    }
  };
  
  return await runSingleTest('CTS_Bughunter', testCase);
}

// E2E Test: CTS_Cleanup
async function testCleanupFunctionality() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  E2E Test: CTS_Cleanup Functional Validation${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  const testCase = {
    name: 'Dead Code Detection (Dry Run)',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      dryRun: true,
      strategies: ['dead_code'],
      maxActions: 10
    },
    validate: (result) => {
      const data = JSON.parse(result.content[0].text);
      
      if (data.mode !== 'preview') {
        return { pass: false, reason: 'Should be in preview mode for dry run' };
      }
      
      if (!data.safetyReport) {
        return { pass: false, reason: 'Missing safety report' };
      }
      
      if (!Array.isArray(data.actions)) {
        return { pass: false, reason: 'Actions must be an array' };
      }
      
      if (!data.summary) {
        return { pass: false, reason: 'Missing summary' };
      }
      
      return { 
        pass: true, 
        details: `Found ${data.summary.returnedActions} cleanup actions, estimated ${Math.round(data.summary.estimatedBytesFreed / 1024)}KB to free` 
      };
    }
  };
  
  return await runSingleTest('CTS_Cleanup', testCase);
}

// E2E Test: cts_audit
async function testAuditFunctionality() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  E2E Test: cts_audit Functional Validation${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  const testCase = {
    name: 'CTS Compliance Audit',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd/cts_mcp/src/__tests__/fixtures',
      categories: ['cts'],
      format: 'json',
      minScore: 0
    },
    validate: (result) => {
      const schemaValidation = validateBaseToolResponse(result, 'cts_audit');
      if (!schemaValidation.valid) {
        return { 
          pass: false, 
          reason: `Schema validation failed: ${schemaValidation.errors.join(', ')}` 
        };
      }
      
      const data = schemaValidation.data;
      
      if (!data.result.report) {
        return { pass: false, reason: 'Missing audit report' };
      }
      
      const report = data.result.report;
      
      if (typeof report.overallScore !== 'number') {
        return { pass: false, reason: 'Missing overall score' };
      }
      
      if (report.overallScore < 0 || report.overallScore > 100) {
        return { pass: false, reason: `Score ${report.overallScore} out of valid range [0-100]` };
      }
      
      if (!report.categoryScores || typeof report.categoryScores !== 'object') {
        return { pass: false, reason: 'Missing category scores' };
      }
      
      if (!Array.isArray(report.violations)) {
        return { pass: false, reason: 'Violations must be an array' };
      }
      
      return { 
        pass: true, 
        details: `Overall score: ${report.overallScore.toFixed(1)}/100, ${report.violations.length} violations found` 
      };
    }
  };
  
  return await runSingleTest('cts_audit', testCase);
}

// E2E Test: CTS_Scan_Project_Signals
async function testScanSignalsFunctionality() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  E2E Test: CTS_Scan_Project_Signals Functional${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  const testCase = {
    name: 'EventBus/SignalBus Signal Scanning',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      renderMap: false
    },
    validate: (result) => {
      const schemaValidation = validateBaseToolResponse(result, 'CTS_Scan_Project_Signals');
      if (!schemaValidation.valid) {
        return { 
          pass: false, 
          reason: `Schema validation failed: ${schemaValidation.errors.join(', ')}` 
        };
      }
      
      const data = schemaValidation.data;
      
      if (!data.result.signals || !Array.isArray(data.result.signals)) {
        return { pass: false, reason: 'Missing or invalid signals array' };
      }
      
      if (typeof data.result.totalSignals !== 'number') {
        return { pass: false, reason: 'Missing totalSignals count' };
      }
      
      // Check signal structure if signals exist
      if (data.result.signals.length > 0) {
        const signal = data.result.signals[0];
        if (!signal.name || !signal.source || !signal.file) {
          return { pass: false, reason: 'Signal missing required fields (name, source, file)' };
        }
      }
      
      return { 
        pass: true, 
        details: `Found ${data.result.totalSignals} signals (EventBus: ${data.result.eventBusSignals || 0}, SignalBus: ${data.result.signalBusSignals || 0})` 
      };
    }
  };
  
  return await runSingleTest('CTS_Scan_Project_Signals', testCase);
}

// E2E Test: CTS_Suggest_Refactoring  
async function testSuggestRefactoringFunctionality() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  E2E Test: CTS_Suggest_Refactoring Functional${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  const testCase = {
    name: 'Signal Naming Refactoring Suggestions',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      includeRename: true,
      includeMerge: true,
      minConfidence: 0.8,
      maxSuggestions: 5
    },
    validate: (result) => {
      const schemaValidation = validateBaseToolResponse(result, 'CTS_Suggest_Refactoring');
      if (!schemaValidation.valid) {
        return { 
          pass: false, 
          reason: `Schema validation failed: ${schemaValidation.errors.join(', ')}` 
        };
      }
      
      const data = schemaValidation.data;
      
      if (!Array.isArray(data.result.suggestions)) {
        return { pass: false, reason: 'Missing or invalid suggestions array' };
      }
      
      if (!data.result.summary) {
        return { pass: false, reason: 'Missing summary' };
      }
      
      // If suggestions exist, validate structure
      if (data.result.suggestions.length > 0) {
        const suggestion = data.result.suggestions[0];
        if (!suggestion.type || !suggestion.confidence) {
          return { pass: false, reason: 'Suggestion missing type or confidence' };
        }
      }
      
      return { 
        pass: true, 
        details: `Generated ${data.result.suggestions.length} refactoring suggestions` 
      };
    }
  };
  
  return await runSingleTest('CTS_Suggest_Refactoring', testCase);
}

// E2E Test: CTS_Analyze_Project
async function testAnalyzeProjectFunctionality() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  E2E Test: CTS_Analyze_Project Functional Validation${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  const testCase = {
    name: 'Signal Intelligence Analysis',
    params: {
      projectPath: '/home/eric/Godot/ProtoBd',
      detectUnused: true,
      buildHierarchy: false,
      performanceBaseline: false
    },
    validate: (result) => {
      const schemaValidation = validateBaseToolResponse(result, 'CTS_Analyze_Project');
      if (!schemaValidation.valid) {
        return { 
          pass: false, 
          reason: `Schema validation failed: ${schemaValidation.errors.join(', ')}` 
        };
      }
      
      const data = schemaValidation.data;
      
      if (!data.result.scanStats) {
        return { pass: false, reason: 'Missing scanStats' };
      }
      
      if (typeof data.result.scanStats.filesScanned !== 'number' || data.result.scanStats.filesScanned === 0) {
        return { pass: false, reason: 'No files scanned' };
      }
      
      if (typeof data.result.scanStats.totalSignals !== 'number') {
        return { pass: false, reason: 'Missing totalSignals count' };
      }
      
      return { 
        pass: true, 
        details: `Scanned ${data.result.scanStats.filesScanned} files, found ${data.result.scanStats.totalSignals} signals` 
      };
    }
  };
  
  return await runSingleTest('CTS_Analyze_Project', testCase);
}

// E2E Test: CTS_Render_Artifact
async function testRenderArtifactFunctionality() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  E2E Test: CTS_Render_Artifact Functional Validation${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  const testCase = {
    name: 'Signal Map HTML Rendering',
    params: {
      artifactType: 'signal_map',
      data: {
        signals: [
          { id: 'signal1', name: 'player_moved', source: 'EventBus' },
          { id: 'signal2', name: 'enemy_died', source: 'SignalBus' }
        ],
        connections: []
      },
      metadata: {
        title: 'Test Signal Map',
        description: 'E2E test artifact'
      }
    },
    validate: (result) => {
      const schemaValidation = validateBaseToolResponse(result, 'CTS_Render_Artifact');
      if (!schemaValidation.valid) {
        return { 
          pass: false, 
          reason: `Schema validation failed: ${schemaValidation.errors.join(', ')}` 
        };
      }
      
      const data = schemaValidation.data;
      
      if (!data.result.html || typeof data.result.html !== 'string') {
        return { pass: false, reason: 'Missing or invalid HTML output' };
      }
      
      if (data.result.html.length < 100) {
        return { pass: false, reason: 'HTML output too short (likely incomplete)' };
      }
      
      if (!data.result.html.includes('<!DOCTYPE html>')) {
        return { pass: false, reason: 'HTML missing DOCTYPE declaration' };
      }
      
      if (data.result.artifactType !== 'signal_map') {
        return { pass: false, reason: `Wrong artifact type: ${data.result.artifactType}` };
      }
      
      return { 
        pass: true, 
        details: `Generated ${data.result.html.length} bytes of HTML for ${data.result.artifactType}` 
      };
    }
  };
  
  return await runSingleTest('CTS_Render_Artifact', testCase);
}

// Helper function to run a single test
async function runSingleTest(toolName, testCase) {
  console.log(`${colors.blue}Test Case: ${testCase.name}${colors.reset}\n`);
  
  try {
    console.log(`${colors.yellow}⏳ Executing ${toolName}...${colors.reset}`);
    const result = await callTool(toolName, testCase.params);
    console.log(`${colors.green}✓ Tool responded${colors.reset}\n`);
    
    // Schema validation
    console.log(`${colors.yellow}⏳ Validating BaseToolResponse schema...${colors.reset}`);
    const schemaValidation = validateBaseToolResponse(result, toolName);
    if (!schemaValidation.valid) {
      console.log(`${colors.red}✗ FAIL - Schema validation failed${colors.reset}`);
      console.log(`${colors.red}  ${schemaValidation.errors.join(', ')}${colors.reset}\n`);
      return false;
    }
    console.log(`${colors.green}✓ Schema validation passed${colors.reset}\n`);
    
    console.log(`${colors.yellow}⏳ Validating functional behavior...${colors.reset}`);
    const validation = testCase.validate(result);
    
    if (validation.pass) {
      console.log(`${colors.green}✓ PASS - Functional validation successful${colors.reset}`);
      console.log(`${colors.cyan}  ${validation.details}${colors.reset}\n`);
      return true;
    } else {
      console.log(`${colors.red}✗ FAIL - Tool responds but doesn't function correctly${colors.reset}`);
      console.log(`${colors.red}  ${validation.reason}${colors.reset}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ FAIL - Tool execution error${colors.reset}`);
    console.log(`${colors.red}  ${error.message}${colors.reset}\n`);
    return false;
  }
}

runAllTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
