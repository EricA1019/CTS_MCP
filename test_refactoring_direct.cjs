#!/usr/bin/env node

/**
 * Direct test of CTS_Suggest_Refactoring to verify tree-sitter works
 */

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'build/index.js');

const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'CTS_Suggest_Refactoring',
    arguments: {
      projectPath: '/home/eric/Godot/ProtoBd',
      includeRename: true,
      includeMerge: true,
      includeDeprecate: false,
      minConfidence: 0.8,
      maxSuggestions: 5
    }
  }
};

console.log('Testing CTS_Suggest_Refactoring with tree-sitter-gdscript 5.0.1...\n');

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let output = '';

server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stdout.on('end', () => {
  try {
    const lines = output.trim().split('\n');
    const response = JSON.parse(lines[lines.length - 1]);
    
    if (response.error) {
      console.error('❌ ERROR:', response.error.message);
      process.exit(1);
    }
    
    if (response.result && response.result.content) {
      const content = response.result.content[0];
      console.log('✅ SUCCESS! Tool executed without errors\n');
      console.log('Response type:', content.type);
      console.log('Response length:', content.text.length, 'chars');
      
      // Check if it contains actual results
      if (content.text.includes('suggestions') || content.text.includes('confidence')) {
        console.log('\n✅ Contains refactoring suggestions!');
      } else {
        console.log('\n⚠️  No suggestions found (might be valid if no issues detected)');
      }
      
      console.log('\n--- First 500 chars of output ---');
      console.log(content.text.substring(0, 500));
      
      process.exit(0);
    } else {
      console.error('❌ Unexpected response format');
      console.log(JSON.stringify(response, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to parse response:', error.message);
    console.log('Raw output:', output);
    process.exit(1);
  }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

// Send request
server.stdin.write(JSON.stringify(request) + '\n');
server.stdin.end();

// Timeout after 60 seconds
setTimeout(() => {
  console.error('❌ Test timed out after 60 seconds');
  server.kill();
  process.exit(1);
}, 60000);
