/**
 * CTS Analyze Project Tool
 * Comprehensive signal intelligence analysis using Phase 3 components
 * 
 * NOTE: This tool currently uses TreeSitterBridge (native bindings).
 * Migration to WASM parser (utils/tree_sitter.ts) is planned for future releases.
 * See: docs/mcp_upgrade_plan.md Tier 1 Task 3
 */

import { z } from 'zod';
import { ToolDefinition, ToolHandler } from '../types.js';
import { validateToolResponse, AnalyzeProjectResponseSchema } from '../schemas.js';
import { Errors } from '../errors.js';
import { TreeSitterBridge } from '../artifacts/parsers/tree_sitter_bridge.js';
import { ProjectScanner } from '../artifacts/scanner/index.js';
import { SignalGraphBuilder } from '../artifacts/graph/index.js';
import { SignalExtractor } from '../artifacts/parsers/signal_extractor.js';
import { UnusedDetector } from '../artifacts/analysis/index.js';
import { HierarchicalClusterer } from '../artifacts/clustering/index.js';
import { PerformanceMonitor } from '../artifacts/monitoring/index.js';

const AnalyzeProjectParamsSchema = z.object({
  projectPath: z.string().describe('Path to Godot project directory'),
  detectUnused: z.boolean().default(true).describe('Detect unused signals'),
  buildHierarchy: z.boolean().default(true).describe('Build hierarchical signal clusters'),
  minClusterSize: z.number().min(2).default(5).describe('Minimum signals per sub-cluster'),
  performanceBaseline: z.boolean().default(false).describe('Establish performance baseline'),
});

export const analyzeProjectTool: ToolDefinition = {
  name: 'CTS_Analyze_Project',
  description: 'Analyze entire Godot project for comprehensive signal intelligence including unused detection, hierarchical clustering, and performance monitoring',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to Godot project directory',
      },
      detectUnused: {
        type: 'boolean',
        description: 'Detect unused signals (orphans, dead emitters, isolated)',
        default: true,
      },
      buildHierarchy: {
        type: 'boolean',
        description: 'Build hierarchical signal clusters with TF-IDF labels',
        default: true,
      },
      minClusterSize: {
        type: 'number',
        description: 'Minimum signals per sub-cluster (2-10)',
        default: 5,
        minimum: 2,
        maximum: 10,
      },
      performanceBaseline: {
        type: 'boolean',
        description: 'Establish performance baseline for future comparisons',
        default: false,
      },
    },
    required: ['projectPath'],
  },
};

/**
 * Create tool handler
 */
export function createAnalyzeProjectHandler(): ToolHandler {
  const monitor = new PerformanceMonitor();
  
  return async (args: Record<string, unknown>) => {
    const startTime = Date.now();
    
    const params = AnalyzeProjectParamsSchema.parse(args);
    
    console.error(`[CTS Analyze] Starting analysis of ${params.projectPath}`);
    console.error(`[CTS Analyze] Options: detectUnused=${params.detectUnused}, buildHierarchy=${params.buildHierarchy}`);
    
    // Initialize components
    const bridge = new TreeSitterBridge();
    const extractor = new SignalExtractor();
    const scanner = new ProjectScanner(bridge);
    const builder = new SignalGraphBuilder(extractor);
    
    // Phase 1: Scan project
    console.error('[CTS Analyze] Phase 1: Scanning project...');
    const scanResult = await monitor.monitorOperation('project_scan', async () => {
      return await scanner.scanProject(params.projectPath);
    });
    
    console.error(`[CTS Analyze] Scanned ${scanResult.length} files`);
    
    // Phase 2: Build signal graph
    console.error('[CTS Analyze] Phase 2: Building signal graph...');
    const graph = await monitor.monitorOperation('graph_build', async () => {
      return await builder.buildFullGraph(scanResult);
    });
    
    const totalEmissions = Array.from(graph.emissions.values()).reduce((sum, arr) => sum + arr.length, 0);
    const totalConnections = Array.from(graph.connections.values()).reduce((sum, arr) => sum + arr.length, 0);
    
    console.error(`[CTS Analyze] Graph: ${graph.definitions.size} signals, ${totalEmissions} emissions, ${totalConnections} connections`);
    
    const results: {
      projectPath: string;
      scanStats: {
        filesScanned: number;
        totalSignals: number;
        totalEmissions: number;
        totalConnections: number;
        scanTime: number;
        graphBuildTime: number;
      };
      unused?: {
        orphanSignals: Array<{ signal: string; file: string; confidence: number; reason: string }>;
        deadEmitters: Array<{ signal: string; file: string; confidence: number; reason: string }>;
        isolatedSignals: Array<{ signal: string; file: string; confidence: number; reason: string }>;
        summary: {
          totalOrphans: number;
          totalDeadEmitters: number;
          totalIsolated: number;
          highConfidenceCount: number;
        };
      };
      clusters?: {
        topLevel: Array<{
          id: string;
          label: string;
          size: number;
          subclusters?: Array<{
            id: string;
            label: string;
            size: number;
            signals: string[];
          }>;
        }>;
        summary: {
          totalClusters: number;
          totalSubclusters: number;
          avgClusterSize: number;
          labelingMethod: string;
        };
      };
      performance: {
        overheadMs: number;
        alertsGenerated: number;
        baselineEstablished: boolean;
      };
    } = {
      projectPath: params.projectPath,
      scanStats: {
        filesScanned: scanResult.length,
        totalSignals: graph.definitions.size,
        totalEmissions,
        totalConnections,
        scanTime: monitor.getMetricsForOperation('project_scan')[0]?.duration || 0,
        graphBuildTime: monitor.getMetricsForOperation('graph_build')[0]?.duration || 0,
      },
      performance: {
        overheadMs: monitor.getStats().avgOverhead,
        alertsGenerated: monitor.getStats().alertsGenerated,
        baselineEstablished: false,
      },
    };
    
    // Phase 3: Unused signal detection (optional)
    if (params.detectUnused) {
      console.error('[CTS Analyze] Phase 3: Detecting unused signals...');
      const detector = new UnusedDetector();
      
      const allUnused = await monitor.monitorOperation('unused_detection', async () => {
        return await detector.detectUnused(graph);
      });
      
      // Separate by pattern
      const orphans = allUnused.filter(u => u.pattern === 'orphan');
      const deadEmitters = allUnused.filter(u => u.pattern === 'dead_emitter');
      const isolated = allUnused.filter(u => u.pattern === 'isolated');
      
      const highConfidenceCount = allUnused.filter(item => item.confidence >= 0.95).length;
      
      results.unused = {
        orphanSignals: orphans.map((o: any) => ({
          signal: o.signalName,
          file: o.locations[0]?.file || 'unknown',
          confidence: o.confidence,
          reason: o.reason || 'Orphan signal: defined but never emitted',
        })),
        deadEmitters: deadEmitters.map((d: any) => ({
          signal: d.signalName,
          file: d.locations[0]?.file || 'unknown',
          confidence: d.confidence,
          reason: d.reason || 'Dead emitter: emitted but never connected',
        })),
        isolatedSignals: isolated.map((i: any) => ({
          signal: i.signalName,
          file: i.locations[0]?.file || 'unknown',
          confidence: i.confidence,
          reason: i.reason || 'Isolated signal: neither emitted nor connected',
        })),
        summary: {
          totalOrphans: orphans.length,
          totalDeadEmitters: deadEmitters.length,
          totalIsolated: isolated.length,
          highConfidenceCount,
        },
      };
      
      console.error(`[CTS Analyze] Found ${highConfidenceCount} high-confidence unused signals`);
    }
    
    // Phase 4: Hierarchical clustering (optional)
    if (params.buildHierarchy) {
      console.error('[CTS Analyze] Phase 4: Building hierarchical clusters...');
      const clusterer = new HierarchicalClusterer();
      
      const hierarchy = await monitor.monitorOperation('hierarchical_clustering', async () => {
        return await clusterer.clusterHierarchical(graph, 2, params.minClusterSize);
      });
      
      let totalSubclusters = 0;
      const topLevel = Array.from(hierarchy.topLevel.clusters.values()).map((cluster: any) => {
        // Check if there are subclusters for this parent cluster
        const parentSubClusters = hierarchy.subClusters?.get(cluster.id);
        
        let subclusters: any[] | undefined;
        if (parentSubClusters) {
          subclusters = Array.from(parentSubClusters.clusters.entries()).map(([subId, signals]: [any, any]) => {
            totalSubclusters++;
            return {
              id: `${cluster.id}.${subId}`,
              label: `Sub-cluster ${subId}`,
              size: signals.size,
              signals: Array.from(signals),
            };
          });
        }
        
        return {
          id: cluster.id.toString(),
          label: cluster.label,
          size: cluster.signals.size,
          subclusters: subclusters && subclusters.length > 0 ? subclusters : undefined,
        };
      });
      
      const clusterSizes = Array.from(hierarchy.topLevel.clusters.values()).map((c: any) => c.signals.size);
      const avgClusterSize = clusterSizes.length > 0
        ? clusterSizes.reduce((sum: number, size: number) => sum + size, 0) / clusterSizes.length
        : 0;
      
      results.clusters = {
        topLevel,
        summary: {
          totalClusters: hierarchy.topLevel.clusters.size,
          totalSubclusters,
          avgClusterSize,
          labelingMethod: 'TF-IDF',
        },
      };
      
      console.error(`[CTS Analyze] Created ${hierarchy.topLevel.clusters.size} top-level clusters with ${totalSubclusters} subclusters`);
    }
    
    // Establish baseline if requested
    if (params.performanceBaseline) {
      console.error('[CTS Analyze] Establishing performance baseline...');
      
      for (const operation of ['project_scan', 'graph_build', 'unused_detection', 'hierarchical_clustering']) {
        const baseline = monitor.calculateBaseline(operation);
        if (baseline) {
          monitor.setBaseline(operation, baseline);
          console.error(`[CTS Analyze] Baseline set for ${operation}: ${baseline.avgDuration.toFixed(2)}ms`);
        }
      }
      
      results.performance.baselineEstablished = true;
    }
    
    console.error('[CTS Analyze] Analysis complete');
    
    const totalDuration = Date.now() - startTime;
    
    // Format response using BaseToolResponse pattern
    const response = {
      success: true as const,
      timestamp: new Date().toISOString(),
      toolName: 'CTS_Analyze_Project' as const,
      duration_ms: totalDuration,
      result: results,
    };
    
    // Validate response format
    const validation = validateToolResponse('CTS_Analyze_Project', response);
    if (!validation.valid) {
      throw Errors.validationError(
        'response',
        'AnalyzeProjectResponse',
        validation.errors?.errors[0]?.message || 'Unknown validation error'
      );
    }
    
    return response;
  };
}
