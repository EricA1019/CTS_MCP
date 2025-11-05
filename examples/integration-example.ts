/**
 * CTS MCP Server Integration Example
 * 
 * Demonstrates full workflow:
 * 1. Connect to MCP server
 * 2. Scan Godot project for signals
 * 3. Render signal map artifact
 * 4. Render hop dashboard artifact
 * 5. Export artifacts to files
 * 
 * Usage:
 *   npm run build
 *   node build/examples/integration-example.js /path/to/godot/project
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Main integration example
 */
async function main() {
  const projectPath = process.argv[2] || '/path/to/godot/project';
  
  console.log('=== CTS MCP Server Integration Example ===\n');
  console.log(`Project Path: ${projectPath}\n`);

  // Step 1: Connect to MCP server
  console.log('[1/5] Connecting to CTS MCP server...');
  const { client, cleanup } = await connectToMCPServer();
  console.log('✓ Connected\n');

  try {
    // Step 2: Scan Godot project for signals
    console.log('[2/5] Scanning project for signals...');
    const scanResult = await scanProjectSignals(client, projectPath);
    console.log(`✓ Found ${scanResult.totalSignals} signals (EventBus: ${scanResult.eventBusSignals}, SignalBus: ${scanResult.signalBusSignals})\n`);

    // Step 3: Render signal map artifact
    console.log('[3/5] Rendering signal map artifact...');
    const signalMapHTML = await renderSignalMap(client, scanResult.signals, projectPath);
    await fs.writeFile('signal_map.html', signalMapHTML);
    console.log('✓ Saved to signal_map.html\n');

    // Step 4: Render hop dashboard artifact
    console.log('[4/5] Rendering hop dashboard artifact...');
    const hopDashboardHTML = await renderHopDashboard(client);
    await fs.writeFile('hop_dashboard.html', hopDashboardHTML);
    console.log('✓ Saved to hop_dashboard.html\n');

    // Step 5: Export summary
    console.log('[5/5] Generating summary...');
    const summary = generateSummary(scanResult, projectPath);
    await fs.writeFile('cts_analysis_summary.md', summary);
    console.log('✓ Saved to cts_analysis_summary.md\n');

    console.log('=== Integration Example Complete ===\n');
    console.log('Generated files:');
    console.log('  - signal_map.html (interactive D3 signal map)');
    console.log('  - hop_dashboard.html (Gantt-style hop dashboard)');
    console.log('  - cts_analysis_summary.md (analysis summary)');

  } finally {
    // Cleanup
    await cleanup();
  }
}

/**
 * Connect to CTS MCP server via stdio transport
 */
async function connectToMCPServer(): Promise<{ client: Client; cleanup: () => Promise<void> }> {
  const client = new Client({
    name: 'cts-integration-example',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  // Path to CTS MCP server (assumes running from examples/ directory)
  const serverPath = path.join(process.cwd(), 'build', 'index.js');

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: {
      CTS_EXPERIMENTAL_MCP_UI: 'true',
      NODE_ENV: 'production'
    }
  });

  await client.connect(transport);

  return {
    client,
    cleanup: async () => {
      await client.close();
    }
  };
}

/**
 * Scan Godot project for signals using CTS_Scan_Project_Signals tool
 */
async function scanProjectSignals(client: Client, projectPath: string): Promise<any> {
  const result: any = await client.callTool({
    name: 'CTS_Scan_Project_Signals',
    arguments: {
      projectPath,
      renderMap: false // We'll render separately
    }
  });

  if (!result.result || !result.result.result) {
    throw new Error('Invalid scan result');
  }

  return result.result.result;
}

/**
 * Render signal map artifact using CTS_Render_Artifact tool
 */
async function renderSignalMap(client: Client, signals: any[], projectPath: string): Promise<string> {
  const result: any = await client.callTool({
    name: 'CTS_Render_Artifact',
    arguments: {
      artifactType: 'signal_map',
      data: {
        signals: signals.map(sig => ({
          name: sig.name,
          source: sig.source,
          params: sig.params || [],
          filePath: sig.file,
          line: sig.line
        })),
        projectPath,
        metadata: {
          eventBusCount: signals.filter(s => s.source === 'EventBus').length,
          signalBusCount: signals.filter(s => s.source === 'SignalBus').length
        }
      },
      metadata: {
        title: `Signal Map - ${path.basename(projectPath)}`,
        description: `Interactive signal architecture visualization (${signals.length} signals)`
      }
    }
  });

  if (!result.result || !result.result.result || !result.result.result.html) {
    throw new Error('Invalid render result');
  }

  return result.result.result.html;
}

/**
 * Render hop dashboard artifact using CTS_Render_Artifact tool
 */
async function renderHopDashboard(client: Client): Promise<string> {
  // Sample hop dashboard data (in real scenario, fetch from Shrimp MCP)
  const hopData = {
    phases: [
      {
        name: 'Phase 1: Foundation',
        hops: [
          {
            id: '1.1a',
            name: 'Project Setup',
            status: 'completed' as const,
            description: 'Initialize Godot project with CTS structure',
            estimatedLOC: 200,
            actualLOC: 185,
            ctsCompliant: true,
            phase: 'Phase 1: Foundation',
            dependencies: [],
            tests: { total: 10, passing: 10, coverage: 100 }
          },
          {
            id: '1.2a',
            name: 'Signal Architecture',
            status: 'in_progress' as const,
            description: 'Implement EventBus and SignalBus',
            estimatedLOC: 300,
            ctsCompliant: true,
            phase: 'Phase 1: Foundation',
            dependencies: ['1.1a']
          },
          {
            id: '1.3a',
            name: 'Testing Framework',
            status: 'planned' as const,
            description: 'Setup GUT testing framework',
            estimatedLOC: 250,
            ctsCompliant: true,
            phase: 'Phase 1: Foundation',
            dependencies: ['1.1a']
          }
        ]
      },
      {
        name: 'Phase 2: Core Mechanics',
        hops: [
          {
            id: '2.1a',
            name: 'Combat System',
            status: 'planned' as const,
            description: 'Turn-based combat mechanics',
            estimatedLOC: 400,
            ctsCompliant: true,
            phase: 'Phase 2: Core Mechanics',
            dependencies: ['1.2a', '1.3a']
          },
          {
            id: '2.2a',
            name: 'Character Stats',
            status: 'planned' as const,
            description: 'Health, stamina, willpower system',
            estimatedLOC: 350,
            ctsCompliant: true,
            phase: 'Phase 2: Core Mechanics',
            dependencies: ['1.2a']
          }
        ]
      }
    ]
  };

  const result: any = await client.callTool({
    name: 'CTS_Render_Artifact',
    arguments: {
      artifactType: 'hop_dashboard',
      data: hopData,
      metadata: {
        title: 'Project Roadmap',
        description: 'CTS hop progress tracking'
      }
    }
  });

  if (!result.result || !result.result.result || !result.result.result.html) {
    throw new Error('Invalid render result');
  }

  return result.result.result.html;
}

/**
 * Generate analysis summary in Markdown format
 */
function generateSummary(scanResult: any, projectPath: string): string {
  const signals = scanResult.signals || [];
  
  const eventBusSignals = signals.filter((s: any) => s.source === 'EventBus');
  const signalBusSignals = signals.filter((s: any) => s.source === 'SignalBus');

  // Group signals by file
  const signalsByFile = signals.reduce((acc: any, sig: any) => {
    const file = sig.file || 'unknown';
    if (!acc[file]) acc[file] = [];
    acc[file].push(sig);
    return acc;
  }, {});

  const markdown = `# CTS Analysis Summary

**Project**: ${path.basename(projectPath)}  
**Path**: ${projectPath}  
**Date**: ${new Date().toISOString()}

## Signal Architecture

- **Total Signals**: ${scanResult.totalSignals}
- **EventBus Signals**: ${scanResult.eventBusSignals}
- **SignalBus Signals**: ${scanResult.signalBusSignals}

### Signals by File

${Object.entries(signalsByFile).map(([file, sigs]: [string, any]) => `
#### ${file} (${sigs.length} signals)

${sigs.map((sig: any) => `- \`${sig.name}\` (line ${sig.line})${sig.params && sig.params.length > 0 ? ` — params: ${sig.params.join(', ')}` : ''}`).join('\n')}
`).join('\n')}

## EventBus Signals

${eventBusSignals.length > 0 ? eventBusSignals.map((sig: any) => `- \`${sig.name}\` (\`${sig.file}\`, line ${sig.line})`).join('\n') : 'None'}

## SignalBus Signals

${signalBusSignals.length > 0 ? signalBusSignals.map((sig: any) => `- \`${sig.name}\` (\`${sig.file}\`, line ${sig.line})`).join('\n') : 'None'}

## Visualizations

- **Signal Map**: \`signal_map.html\` — Interactive D3 force-directed graph
- **Hop Dashboard**: \`hop_dashboard.html\` — Gantt-style task progress

## Next Steps

1. Review signal architecture in \`signal_map.html\`
2. Identify signal usage patterns (emitters, listeners)
3. Check for signal leaks (emitted but not connected)
4. Track CTS hop progress in \`hop_dashboard.html\`
5. Ensure all signals documented in \`SIGNAL_CONTRACTS.md\`

---

*Generated by CTS MCP Server v3.1.0*
`;

  return markdown;
}

// Run the example
main().catch(error => {
  console.error('Integration example failed:', error);
  process.exit(1);
});
