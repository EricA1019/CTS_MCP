/**
 * React Hop Dashboard Renderer
 * Interactive status board for phase/hop tracking with CTS compliance
 */
import { ArtifactRenderer } from '../types.js';
export interface HopData {
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
}
export interface PhaseData {
    name: string;
    hops: HopData[];
}
export interface HopDashboardData {
    currentPhase: string;
    phases: PhaseData[];
    stats: {
        totalLOC: number;
        plannedLOC: number;
        ctsComplianceRate: number;
        completionRate: number;
    };
}
export declare class ReactHopDashboardRenderer implements ArtifactRenderer {
    readonly type = "hop_dashboard";
    render(data: unknown): Promise<string>;
}
//# sourceMappingURL=react_hop_dashboard.d.ts.map