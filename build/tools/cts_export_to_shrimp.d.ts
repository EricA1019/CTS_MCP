/**
 * CTS Export to Shrimp Tool
 * Converts hop plan JSON to Shrimp task format
 */
import { ToolDefinition, ToolHandler } from '../types.js';
interface HopPlan {
    hopId: string;
    name: string;
    description: string;
    dependencies: string[];
    estimatedLOC: number;
    deliverables?: string[];
    acceptanceCriteria?: string[];
    technicalNotes?: string;
    subHops?: SubHop[];
}
interface SubHop {
    id: string;
    name: string;
    description: string;
    estimatedLOC: number;
    deliverables?: string[];
}
interface ShrimpTask {
    name: string;
    description: string;
    implementationGuide: string;
    notes?: string;
    dependencies: string[];
    relatedFiles: RelatedFile[];
    verificationCriteria: string;
}
interface RelatedFile {
    path: string;
    type: 'TO_MODIFY' | 'REFERENCE' | 'CREATE' | 'DEPENDENCY' | 'OTHER';
    description: string;
    lineStart?: number;
    lineEnd?: number;
}
/**
 * Convert HOP plan to Shrimp task format
 */
export declare function convertHopToShrimpTask(hop: HopPlan): ShrimpTask;
/**
 * Convert sub-hop to Shrimp task
 */
export declare function convertSubHopToTask(subHop: SubHop, parentHopId: string): ShrimpTask;
/**
 * Tool handler for CTS_Export_to_Shrimp
 */
export declare const ctsExportToShrimpHandler: ToolHandler;
/**
 * Tool definition for CTS_Export_to_Shrimp
 */
export declare const ctsExportToShrimpTool: ToolDefinition;
export {};
//# sourceMappingURL=cts_export_to_shrimp.d.ts.map