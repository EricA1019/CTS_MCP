#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function inspectReasoning() {
  return new Promise((resolve) => {
    const server = spawn('node', [path.join(__dirname, 'build', 'index.js')], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    server.stdout.on('data', (data) => stdout += data.toString());
    server.on('close', () => {
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.jsonrpc === '2.0' && parsed.result) {
            resolve(parsed.result);
            return;
          }
        } catch (e) { continue; }
      }
    });

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'CTS_Reasoning',
        arguments: {
          topic: 'Why might tree-sitter-gdscript fail to compile on Node.js 22.18.0 with ABI 127',
          context: 'Error: No native build found for platform=linux arch=x64',
          maxIterations: 4
        }
      }
    };

    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

const result = await inspectReasoning();
const data = JSON.parse(result.content[0].text);

console.log('\n═══ ACTUAL CTS_REASONING OUTPUT ═══\n');
data.reasoning_chain.forEach((iter, idx) => {
  console.log(`\n[Iteration ${idx + 1}] Stage: ${iter.stage}`);
  console.log(`Thought: ${iter.thought}`);
  console.log(`Next needed: ${iter.next_thought_needed}`);
});

console.log('\n\n═══ ANALYSIS ═══');
console.log(`Total iterations: ${data.reasoning_chain.length}`);
console.log(`Unique stages: ${new Set(data.reasoning_chain.map(c => c.stage)).size}`);
console.log(`Unique thoughts: ${new Set(data.reasoning_chain.map(c => c.thought)).size}`);

const allText = data.reasoning_chain.map(c => c.thought).join(' ');
console.log(`\nContains "because": ${allText.includes('because')}`);
console.log(`Contains "therefore": ${allText.includes('therefore')}`);
console.log(`Contains "abi": ${allText.toLowerCase().includes('abi')}`);
console.log(`Contains "compile": ${allText.toLowerCase().includes('compile')}`);
