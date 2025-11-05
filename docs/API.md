# CTS MCP Server API Documentation

**Version:** 3.1.0  
**Last Updated:** November 4, 2025

Comprehensive API reference for the CTS (Close-to-Shore) Model Context Protocol server. This documentation covers all MCP tools, artifact types, renderer APIs, integration patterns, and code examples.

---

## Table of Contents

1. [MCP Tools](#mcp-tools)
   - [CTS_Scan_Project_Signals](#cts_scan_project_signals)
   - [CTS_Render_Artifact](#cts_render_artifact)
2. [Artifact Types](#artifact-types)
   - [signal_map](#signal_map)
   - [hop_dashboard](#hop_dashboard)
3. [Renderer APIs](#renderer-apis)
   - [D3GraphRenderer](#d3graphrenderer)
   - [InteractiveSignalMapRenderer](#interactivesignalmaprenderer)
   - [D3HopDashboardRenderer](#d3hopdashboardrenderer)
4. [Integration Patterns](#integration-patterns)
   - [Custom Renderer Registration](#custom-renderer-registration)
   - [New Artifact Types](#new-artifact-types)
   - [MCP-UI Framework Integration](#mcp-ui-framework-integration)
5. [Code Examples](#code-examples)
   - [Scan and Visualize Signals](#scan-and-visualize-signals)
   - [Render Hop Dashboard](#render-hop-dashboard)
   - [Create Custom Renderer](#create-custom-renderer)
   - [Export Artifacts](#export-artifacts)

---

## MCP Tools

### CTS_Scan_Project_Signals

Scan Godot project for EventBus and SignalBus signal definitions. Optionally renders an interactive D3 signal map visualization.

**Tool Name:** `CTS_Scan_Project_Signals`

#### Parameters

```typescript
{
  projectPath: string;    // Absolute path to Godot project directory
  renderMap?: boolean;    // Generate D3.js signal map visualization (default: true)
}
```

#### Response Schema

```typescript
{
  success: true;
  timestamp: string;      // ISO 8601 timestamp
  toolName: 'CTS_Scan_Project_Signals';
  result: {
    projectPath: string;
    totalSignals: number;
    eventBusSignals: number;    // Count of EventBus signals
    signalBusSignals: number;   // Count of SignalBus signals
    signals: Array<{
      name: string;
      source: 'EventBus' | 'SignalBus';
      params: string[];         // Signal parameter names
      file: string;             // Relative file path
      line: number;             // Line number of definition
    }>;
    rendered: boolean;          // Whether signal map was rendered
    html?: string;              // HTML artifact (if renderMap=true)
    cached: boolean;            // Whether result was cached
  };
}
```

#### Example Usage

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

// Initialize MCP client
const client = new Client({ name: 'cts-client', version: '1.0.0' });

// Scan Godot project and render signal map
const result = await client.callTool({
  name: 'CTS_Scan_Project_Signals',
  arguments: {
    projectPath: '/path/to/godot/project',
    renderMap: true
  }
});

console.log(`Found ${result.result.totalSignals} signals`);
console.log(`- EventBus: ${result.result.eventBusSignals}`);
console.log(`- SignalBus: ${result.result.signalBusSignals}`);

if (result.result.html) {
  // Display HTML artifact in webview
  await displayInWebview(result.result.html);
}
```

#### Performance

- **Scan Time:** ~500ms for 1000-file project
- **Render Time:** <100ms for small projects (<50 signals), <2s for large projects (>500 signals)
- **Lazy Loading:** Automatically activated for graphs with >100 nodes

---

### CTS_Render_Artifact

Render CTS artifacts (signal maps, hop dashboards) as HTML for display in VS Code webview or browser.

**Tool Name:** `CTS_Render_Artifact`

#### Parameters

```typescript
{
  artifactType: 'signal_map' | 'hop_dashboard';
  data: unknown;            // Artifact-specific data (see Artifact Types)
  metadata?: {
    title?: string;
    description?: string;
  };
}
```

#### Response Schema

```typescript
{
  success: true;
  timestamp: string;
  toolName: 'CTS_Render_Artifact';
  result: {
    html: string;           // HTML artifact
    artifactType: 'signal_map' | 'hop_dashboard';
    renderer: string;       // Renderer type used (e.g., "interactive_signal_map")
  };
}
```

#### Example Usage (Signal Map)

```typescript
const signalMapResult = await client.callTool({
  name: 'CTS_Render_Artifact',
  arguments: {
    artifactType: 'signal_map',
    data: {
      signals: [
        {
          name: 'player_health_changed',
          source: 'EventBus',
          params: ['new_health', 'old_health'],
          filePath: 'scripts/player.gd',
          line: 42
        },
        {
          name: 'enemy_spawned',
          source: 'EventBus',
          params: ['enemy_type', 'position'],
          filePath: 'scripts/enemy_manager.gd',
          line: 105
        }
      ],
      projectPath: '/path/to/project',
      metadata: {
        eventBusCount: 2,
        signalBusCount: 0
      }
    },
    metadata: {
      title: 'Player & Combat Signals',
      description: 'Core gameplay signal architecture'
    }
  }
});

// Render in VS Code webview
await vscode.env.openExternal(vscode.Uri.parse(
  `data:text/html;base64,${Buffer.from(signalMapResult.result.html).toString('base64')}`
));
```

#### Example Usage (Hop Dashboard)

```typescript
const hopDashboardResult = await client.callTool({
  name: 'CTS_Render_Artifact',
  arguments: {
    artifactType: 'hop_dashboard',
    data: {
      phases: [
        {
          name: 'Phase 1: Foundation',
          hops: [
            {
              id: '1.1a',
              name: 'Project Setup',
              status: 'completed',
              description: 'Initialize Godot project with CTS structure',
              estimatedLOC: 200,
              actualLOC: 185,
              ctsCompliant: true,
              phase: 'Phase 1: Foundation',
              dependencies: []
            },
            {
              id: '1.2a',
              name: 'Signal Architecture',
              status: 'in_progress',
              description: 'Implement EventBus and SignalBus',
              estimatedLOC: 300,
              ctsCompliant: true,
              phase: 'Phase 1: Foundation',
              dependencies: ['1.1a']
            }
          ]
        }
      ]
    },
    metadata: {
      title: 'Project Roadmap',
      description: 'CTS hop progress tracking'
    }
  }
});
```

---

## Artifact Types

### signal_map

Interactive D3 force-directed graph visualization of Godot signal architecture. Shows signal definitions, emitters, listeners, and relationships.

#### Data Structure

```typescript
interface SignalMapData {
  signals: Array<{
    name: string;
    source: 'EventBus' | 'SignalBus';
    params: string[];
    filePath: string;
    line: number;
  }>;
  projectPath: string;
  metadata?: {
    eventBusCount: number;
    signalBusCount: number;
  };
  clusters?: Array<{
    id: string;
    label: string;
    signalIds: string[];
  }>;
}
```

#### Rendering Features

- **Force-Directed Layout:** Nodes repel, edges attract, clusters group
- **Interactive Controls:**
  - Zoom/pan (mouse wheel, drag background)
  - Node dragging (repositionable nodes)
  - Filter by source (EventBus/SignalBus toggle)
  - Search signals by name
  - Export (PNG/SVG/PDF)
- **Lazy Loading:** Automatically activated for graphs >100 nodes
  - Initial batch: 50 nodes
  - "Load More" button: +50 nodes per click
- **Color Coding:**
  - EventBus signals: Blue nodes
  - SignalBus signals: Green nodes
  - Clusters: Colored borders
- **Dark/Light Themes:** Automatic theme detection (respects VS Code theme)

#### Customization

```typescript
// Custom color scheme (modify D3GraphRenderer)
const customColors = {
  EventBus: '#ff6b6b',
  SignalBus: '#4ecdc4',
  background: '#1e1e1e',
  text: '#d4d4d4'
};

// Custom simulation parameters
const simulationConfig = {
  linkStrength: 0.5,
  chargeStrength: -300,
  centerStrength: 0.1,
  maxTicks: 500
};
```

---

### hop_dashboard

Gantt-style visualization of CTS hop progress. Shows phases, hops, dependencies, completion status, and LOC budget.

#### Data Structure

```typescript
interface HopDashboardData {
  phases: Array<{
    name: string;
    hops: Array<{
      id: string;
      name: string;
      status: 'planned' | 'in_progress' | 'completed';
      description: string;
      estimatedLOC: number;
      actualLOC?: number;
      ctsCompliant: boolean;
      phase: string;
      dependencies: string[];
      tests?: {
        total: number;
        passing: number;
        coverage: number;
      };
    }>;
  }>;
}
```

#### Rendering Features

- **Horizontal Timeline:** Phases on X-axis, hops stacked vertically
- **Status Color Coding:**
  - Planned: Gray (#888888)
  - In Progress: Blue (#4a9eff)
  - Completed: Green (#4caf50)
- **Dependency Arrows:** Left-to-right flow, curved paths
- **Interactive Stats Panel:**
  - Total hops count
  - Completion rate (%)
  - LOC budget tracking
  - CTS compliance rate
- **Filter Controls:**
  - By phase (dropdown)
  - By status (checkboxes)
- **Progressive Rendering:** Automatically activated for dashboards >10 hops
  - Yields to main thread after each section
  - Prevents UI freezing on large projects

#### Customization

```typescript
// Custom status colors
const statusColors = {
  planned: '#ffa500',
  in_progress: '#ffeb3b',
  completed: '#8bc34a'
};

// Custom layout dimensions
const layoutConfig = {
  hopHeight: 60,
  phaseSpacing: 120,
  dependencyArrowCurve: 0.3
};
```

---

## Renderer APIs

### D3GraphRenderer

Core force-directed graph renderer using D3.js. Provides interactive visualization engine for signal maps and hop dashboards.

**File:** `src/artifacts/visualizations/D3GraphRenderer.ts`

#### Constructor

```typescript
class D3GraphRenderer {
  private readonly LAZY_THRESHOLD = 100;  // Activate lazy loading at 100+ nodes
  private readonly INITIAL_BATCH = 50;    // Initial nodes to render

  constructor()
}
```

#### Public Methods

##### `generateForceDirectedGraph(nodes: GraphNode[], edges: GraphEdge[]): string`

Generate interactive SVG force-directed graph.

**Parameters:**
- `nodes` — Array of graph nodes (signals, hops)
- `edges` — Array of graph edges (relationships, dependencies)

**Returns:** HTML string with embedded SVG and interaction scripts

**Example:**

```typescript
import { D3GraphRenderer, GraphNode, GraphEdge } from './visualizations/D3GraphRenderer.js';

const renderer = new D3GraphRenderer();

const nodes: GraphNode[] = [
  { id: 'sig1', label: 'player_health_changed', type: 'EventBus' },
  { id: 'sig2', label: 'enemy_spawned', type: 'EventBus' }
];

const edges: GraphEdge[] = [
  { source: 'sig1', target: 'sig2', type: 'connect' }
];

const html = renderer.generateForceDirectedGraph(nodes, edges);
```

#### Performance Characteristics

- **Small graphs (<50 nodes):** ~100ms render time
- **Medium graphs (50-100 nodes):** ~500ms render time
- **Large graphs (100-500 nodes):** <2s render time (with lazy loading)
- **Lazy Loading:** Initial 50 nodes, then +50 per "Load More" click

---

### InteractiveSignalMapRenderer

High-level renderer for signal map artifacts. Wraps D3GraphRenderer with signal-specific logic, clustering, and theme integration.

**File:** `src/artifacts/renderers/interactive_signal_map.ts`

#### Constructor

```typescript
class InteractiveSignalMapRenderer implements ArtifactRenderer {
  type = 'signal_map_mcp_ui' as const;

  constructor(
    private graphRenderer: D3GraphRenderer,
    private themeManager: ThemeManager,
    private exportCoordinator: ExportCoordinator
  )
}
```

#### Public Methods

##### `async render(data: unknown, metadata?: ArtifactMetadata): Promise<{ html: string; metadata: any }>`

Render signal map artifact with clustering and theme support.

**Parameters:**
- `data` — Signal map data (see [signal_map](#signal_map) structure)
- `metadata` — Optional artifact metadata (title, description)

**Returns:** Promise with HTML and metadata

**Example:**

```typescript
import { InteractiveSignalMapRenderer } from './renderers/interactive_signal_map.js';
import { D3GraphRenderer } from './visualizations/D3GraphRenderer.js';
import { ThemeManager } from './ui/ThemeManager.js';
import { ExportCoordinator } from './ui/ExportCoordinator.js';

const renderer = new InteractiveSignalMapRenderer(
  new D3GraphRenderer(),
  new ThemeManager(),
  new ExportCoordinator()
);

const result = await renderer.render(
  {
    signals: [/* ... */],
    projectPath: '/path/to/project'
  },
  {
    title: 'My Signal Map',
    description: 'Project signal architecture'
  }
);

console.log(result.html); // HTML artifact
```

---

### D3HopDashboardRenderer

Gantt-style renderer for Shrimp task progress. Reuses D3GraphRenderer for layout, adapts to horizontal timeline format.

**File:** `src/artifacts/renderers/d3_hop_dashboard.ts`

#### Constructor

```typescript
class D3HopDashboardRenderer implements ArtifactRenderer {
  type = 'hop_dashboard_mcp_ui' as const;

  constructor()
}
```

#### Public Methods

##### `async render(data: unknown, metadata?: ArtifactMetadata): Promise<{ html: string; metadata: any }>`

Render hop dashboard with phase timeline, status indicators, and dependency arrows.

**Parameters:**
- `data` — Hop dashboard data (see [hop_dashboard](#hop_dashboard) structure)
- `metadata` — Optional artifact metadata

**Returns:** Promise with HTML and metadata

**Example:**

```typescript
import { D3HopDashboardRenderer } from './renderers/d3_hop_dashboard.js';

const renderer = new D3HopDashboardRenderer();

const result = await renderer.render(
  {
    phases: [
      {
        name: 'Phase 1',
        hops: [
          {
            id: '1.1a',
            name: 'Setup',
            status: 'completed',
            description: 'Initialize project',
            estimatedLOC: 200,
            actualLOC: 185,
            ctsCompliant: true,
            phase: 'Phase 1',
            dependencies: []
          }
        ]
      }
    ]
  },
  { title: 'Project Roadmap' }
);
```

#### Progressive Rendering

For dashboards with >10 hops, the renderer automatically yields to the main thread:

```typescript
private async yieldToMainThread(): Promise<void> {
  return new Promise(resolve => {
    if (typeof setImmediate !== 'undefined') {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
}
```

This prevents UI freezing on large projects.

---

## Integration Patterns

### Custom Renderer Registration

Add new renderers to the ArtifactEngine for custom artifact types.

**Step 1: Implement ArtifactRenderer Interface**

```typescript
// src/artifacts/renderers/my_custom_renderer.ts
import { ArtifactRenderer, ArtifactMetadata } from '../types.js';

export class MyCustomRenderer implements ArtifactRenderer {
  type = 'my_custom_type' as const;

  async render(data: unknown, metadata?: ArtifactMetadata): Promise<{ html: string; metadata: any }> {
    // Validate data
    const validData = this.validateData(data);

    // Generate HTML
    const html = this.generateHTML(validData, metadata);

    return {
      html,
      metadata: {
        type: this.type,
        timestamp: new Date().toISOString(),
        dataSize: JSON.stringify(data).length
      }
    };
  }

  private validateData(data: unknown): MyCustomData {
    // Validation logic
    if (!this.isMyCustomData(data)) {
      throw new Error('Invalid data structure');
    }
    return data;
  }

  private generateHTML(data: MyCustomData, metadata?: ArtifactMetadata): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${metadata?.title || 'Custom Artifact'}</title>
          <style>/* ... */</style>
        </head>
        <body>
          <h1>${metadata?.title}</h1>
          <p>${metadata?.description}</p>
          <!-- Custom visualization -->
        </body>
      </html>
    `;
  }

  private isMyCustomData(data: unknown): data is MyCustomData {
    // Type guard
    return typeof data === 'object' && data !== null && 'customField' in data;
  }
}

interface MyCustomData {
  customField: string;
}
```

**Step 2: Register with ArtifactEngine**

```typescript
// src/server.ts
import { MyCustomRenderer } from './artifacts/renderers/my_custom_renderer.js';

class CTSMCPServer {
  private artifactEngine: ArtifactEngine;

  constructor() {
    this.artifactEngine = new ArtifactEngine();

    // Register custom renderer
    this.artifactEngine.registerRenderer(new MyCustomRenderer());
  }
}
```

**Step 3: Use in MCP Tool**

```typescript
const result = await client.callTool({
  name: 'CTS_Render_Artifact',
  arguments: {
    artifactType: 'my_custom_type',
    data: {
      customField: 'example data'
    },
    metadata: {
      title: 'My Custom Artifact'
    }
  }
});
```

---

### New Artifact Types

Extend the CTS MCP server with new artifact types.

**Step 1: Define MCP Tool**

```typescript
// src/tools/my_custom_tool.ts
import { z } from 'zod';
import { ToolDefinition, ToolHandler } from '../types.js';
import { ArtifactEngine } from '../artifacts/artifact_engine.js';

const MyCustomToolParamsSchema = z.object({
  dataPath: z.string(),
  renderVisualization: z.boolean().default(true),
});

export function createMyCustomToolHandler(engine: ArtifactEngine): ToolHandler {
  return async (args: Record<string, unknown>) => {
    const params = MyCustomToolParamsSchema.parse(args);

    // Fetch/process data
    const data = await loadMyCustomData(params.dataPath);

    // Optionally render artifact
    let html: string | undefined;
    if (params.renderVisualization) {
      const result = await engine.renderArtifact('my_custom_type', data);
      html = result.html;
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      toolName: 'My_Custom_Tool',
      result: {
        data,
        html
      }
    };
  };
}

export const myCustomTool: ToolDefinition = {
  name: 'My_Custom_Tool',
  description: 'Custom tool for processing data',
  inputSchema: {
    type: 'object',
    properties: {
      dataPath: { type: 'string', description: 'Path to data file' },
      renderVisualization: { type: 'boolean', default: true }
    },
    required: ['dataPath']
  }
};
```

**Step 2: Register Tool in Server**

```typescript
// src/server.ts
import { myCustomTool, createMyCustomToolHandler } from './tools/my_custom_tool.js';

class CTSMCPServer {
  private setupTools(): void {
    this.registerTool(myCustomTool, createMyCustomToolHandler(this.artifactEngine));
  }
}
```

---

### MCP-UI Framework Integration

Integrate CTS renderers with the MCP-UI framework for VS Code webviews.

**Step 1: Enable Experimental MCP-UI**

```bash
export CTS_EXPERIMENTAL_MCP_UI=true
npm start
```

**Step 2: Conditional Renderer Registration**

```typescript
// src/server.ts
private registerRenderers(): void {
  const useMcpUI = process.env.CTS_EXPERIMENTAL_MCP_UI === 'true';

  if (useMcpUI) {
    // Register D3-based MCP-UI renderers
    this.artifactEngine.registerRenderer(
      new InteractiveSignalMapRenderer(
        new D3GraphRenderer(),
        new ThemeManager(),
        new ExportCoordinator()
      )
    );

    this.artifactEngine.registerRenderer(new D3HopDashboardRenderer());
  } else {
    // Legacy placeholder renderers
    this.artifactEngine.registerRenderer(new PlaceholderSignalMapRenderer());
    this.artifactEngine.registerRenderer(new PlaceholderHopDashboardRenderer());
  }
}
```

**Step 3: Deprecation Warnings**

```typescript
if (!useMcpUI) {
  console.warn('[DEPRECATED] Legacy renderers active. Set CTS_EXPERIMENTAL_MCP_UI=true for production renderers.');
}
```

---

## Code Examples

### Scan and Visualize Signals

Complete workflow: scan Godot project → render signal map → display in VS Code webview.

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import * as vscode from 'vscode';

async function scanAndVisualizeSignals(projectPath: string) {
  // 1. Initialize MCP client
  const client = new Client({
    name: 'cts-vscode-extension',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  // Connect to CTS MCP server (assumes server running on stdio)
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['/path/to/cts_mcp/build/index.js']
  });

  await client.connect(transport);

  // 2. Scan project and render signal map
  const result = await client.callTool({
    name: 'CTS_Scan_Project_Signals',
    arguments: {
      projectPath,
      renderMap: true
    }
  });

  // 3. Check for signals
  if (result.result.totalSignals === 0) {
    vscode.window.showInformationMessage('No signals found in project.');
    return;
  }

  // 4. Display HTML in webview
  const panel = vscode.window.createWebviewPanel(
    'ctsSignalMap',
    `Signal Map - ${result.result.totalSignals} signals`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  panel.webview.html = result.result.html!;

  // 5. Show summary
  vscode.window.showInformationMessage(
    `Found ${result.result.totalSignals} signals (EventBus: ${result.result.eventBusSignals}, SignalBus: ${result.result.signalBusSignals})`
  );

  // 6. Cleanup
  await client.close();
}
```

---

### Render Hop Dashboard

Render Shrimp task progress dashboard.

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import * as fs from 'fs/promises';

async function renderHopDashboard(taskDataPath: string) {
  const client = new Client({ name: 'cts-cli', version: '1.0.0' }, {});
  await client.connect(/* transport */);

  // Load task data from Shrimp JSON
  const taskData = JSON.parse(await fs.readFile(taskDataPath, 'utf-8'));

  // Transform to hop dashboard format
  const hopData = {
    phases: taskData.phases.map(phase => ({
      name: phase.name,
      hops: phase.hops.map(hop => ({
        id: hop.id,
        name: hop.name,
        status: hop.status,
        description: hop.description,
        estimatedLOC: hop.estimatedLOC,
        actualLOC: hop.actualLOC,
        ctsCompliant: hop.ctsCompliant || false,
        phase: phase.name,
        dependencies: hop.dependencies || []
      }))
    }))
  };

  // Render dashboard
  const result = await client.callTool({
    name: 'CTS_Render_Artifact',
    arguments: {
      artifactType: 'hop_dashboard',
      data: hopData,
      metadata: {
        title: 'Project Roadmap',
        description: `${taskData.phases.length} phases, ${hopData.phases.reduce((sum, p) => sum + p.hops.length, 0)} hops`
      }
    }
  });

  // Save HTML to file
  await fs.writeFile('hop_dashboard.html', result.result.html);
  console.log('Dashboard saved to hop_dashboard.html');

  await client.close();
}
```

---

### Create Custom Renderer

Full example: custom renderer for test coverage artifacts.

```typescript
// src/artifacts/renderers/test_coverage_renderer.ts
import { ArtifactRenderer, ArtifactMetadata } from '../types.js';

interface TestCoverageData {
  files: Array<{
    path: string;
    coverage: number;
    lines: { total: number; covered: number };
  }>;
  totalCoverage: number;
}

export class TestCoverageRenderer implements ArtifactRenderer {
  type = 'test_coverage' as const;

  async render(data: unknown, metadata?: ArtifactMetadata): Promise<{ html: string; metadata: any }> {
    const coverageData = this.validateData(data);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${metadata?.title || 'Test Coverage Report'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
            h1 { color: #4ec9b0; }
            .file { margin: 10px 0; padding: 10px; background: #252526; border-radius: 4px; }
            .coverage { float: right; font-weight: bold; }
            .high { color: #4caf50; }
            .medium { color: #ff9800; }
            .low { color: #f44336; }
          </style>
        </head>
        <body>
          <h1>${metadata?.title || 'Test Coverage Report'}</h1>
          <p>Overall Coverage: <span class="${this.getCoverageClass(coverageData.totalCoverage)}">${coverageData.totalCoverage.toFixed(1)}%</span></p>
          
          <h2>Files</h2>
          ${coverageData.files.map(file => `
            <div class="file">
              <span>${file.path}</span>
              <span class="coverage ${this.getCoverageClass(file.coverage)}">${file.coverage.toFixed(1)}%</span>
              <br>
              <small>${file.lines.covered} / ${file.lines.total} lines covered</small>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    return {
      html,
      metadata: {
        type: this.type,
        timestamp: new Date().toISOString(),
        totalCoverage: coverageData.totalCoverage,
        fileCount: coverageData.files.length
      }
    };
  }

  private validateData(data: unknown): TestCoverageData {
    if (!this.isTestCoverageData(data)) {
      throw new Error('Invalid test coverage data structure');
    }
    return data;
  }

  private isTestCoverageData(data: unknown): data is TestCoverageData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'files' in data &&
      Array.isArray(data.files) &&
      'totalCoverage' in data &&
      typeof data.totalCoverage === 'number'
    );
  }

  private getCoverageClass(coverage: number): string {
    if (coverage >= 80) return 'high';
    if (coverage >= 50) return 'medium';
    return 'low';
  }
}
```

**Register and use:**

```typescript
// src/server.ts
this.artifactEngine.registerRenderer(new TestCoverageRenderer());

// Usage
const result = await client.callTool({
  name: 'CTS_Render_Artifact',
  arguments: {
    artifactType: 'test_coverage',
    data: {
      files: [
        { path: 'src/utils.ts', coverage: 95.2, lines: { total: 100, covered: 95 } },
        { path: 'src/parser.ts', coverage: 78.5, lines: { total: 200, covered: 157 } }
      ],
      totalCoverage: 85.3
    },
    metadata: { title: 'Unit Test Coverage' }
  }
});
```

---

### Export Artifacts

Export signal maps and hop dashboards to PNG/SVG/PDF.

```typescript
import { ExportCoordinator } from './ui/ExportCoordinator.js';

async function exportArtifacts() {
  const exportCoordinator = new ExportCoordinator();

  // Render signal map
  const signalMapResult = await client.callTool({
    name: 'CTS_Scan_Project_Signals',
    arguments: { projectPath: '/path/to/project', renderMap: true }
  });

  // Create temporary HTML file
  await fs.writeFile('/tmp/signal_map.html', signalMapResult.result.html);

  // Export to PNG (requires browser environment or headless Chrome)
  // Note: ExportCoordinator uses browser APIs, requires webview context
  // For CLI export, use Puppeteer or Playwright:

  import puppeteer from 'puppeteer';

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(signalMapResult.result.html);

  // Export as PNG
  await page.screenshot({
    path: 'signal_map.png',
    fullPage: true
  });

  // Export as PDF
  await page.pdf({
    path: 'signal_map.pdf',
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  console.log('Exported signal_map.png and signal_map.pdf');
}
```

---

## Performance Metrics

### Signal Scanning

| Project Size | Files | Signals | Scan Time | Render Time |
|-------------|-------|---------|-----------|-------------|
| Small       | 10    | 15      | ~50ms     | ~100ms      |
| Medium      | 100   | 150     | ~200ms    | ~500ms      |
| Large       | 1000  | 1000    | ~500ms    | ~2s         |

### Lazy Loading

- **Threshold:** 100 nodes
- **Initial Batch:** 50 nodes (~300ms)
- **Load More:** +50 nodes per click (~200ms)
- **Memory:** <10MB growth over 10 renders

### Bundle Size

- **Total:** ~480KB (tree-shaken D3)
- **D3 Core:** ~180KB
- **Renderers:** ~120KB
- **Utilities:** ~180KB

---

## FAQ

### How do I enable MCP-UI renderers?

Set the `CTS_EXPERIMENTAL_MCP_UI=true` environment variable:

```bash
export CTS_EXPERIMENTAL_MCP_UI=true
npm start
```

### Can I customize signal map colors?

Yes! Modify `D3GraphRenderer.ts`:

```typescript
const colorScheme = {
  EventBus: '#your-color',
  SignalBus: '#your-color'
};
```

### How do I handle large signal graphs (>500 signals)?

Lazy loading automatically activates at 100+ nodes. For extremely large graphs:

1. Increase `LAZY_THRESHOLD` in `D3GraphRenderer.ts`
2. Reduce `INITIAL_BATCH` for faster initial render
3. Use signal filtering (by file, type) to reduce visible nodes

### Can I run the server in production?

Yes! See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide.

### How do I debug renderer issues?

1. Enable debug mode: `export DEBUG=true`
2. Check browser console (webview DevTools)
3. Inspect `build/` directory for compiled artifacts
4. Run `npm test` to verify renderer tests

---

## Version History

### v3.1.0 (November 4, 2025)

- ✅ **Phase 3 Complete:** Production-ready D3 renderers
- ✅ Added `D3HopDashboardRenderer` for Gantt-style task visualization
- ✅ Implemented lazy loading for large signal graphs (>100 nodes)
- ✅ Progressive rendering for hop dashboards (>10 hops)
- ✅ Performance optimizations (<2s render, <500KB bundle)
- ✅ 96 new tests (100% coverage for Phase 3)

### v3.0.0 (November 3, 2025)

- ✅ **Phase 2 Complete:** Real D3 signal map visualization
- ✅ Replaced placeholder HTML with `InteractiveSignalMapRenderer`
- ✅ Integrated `D3GraphRenderer` for force-directed layouts
- ✅ Added theme support (ThemeManager), export support (ExportCoordinator)
- ✅ Signal relationship detection (emit/connect tracking)
- ✅ 260 tests with full integration coverage

---

## Support

For issues, feature requests, or questions:

- **GitHub Issues:** https://github.com/your-repo/cts_mcp/issues
- **Documentation:** https://github.com/your-repo/cts_mcp/tree/main/docs
- **Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Last Updated:** November 4, 2025  
**Maintainers:** CTS Development Team
