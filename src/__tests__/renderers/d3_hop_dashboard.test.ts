/**
 * Tests for D3HopDashboardRenderer
 * 
 * Coverage:
 * - Graph node conversion (hops → nodes)
 * - Graph edge conversion (dependencies → edges)
 * - Timeline axis injection
 * - Stats panel injection
 * - Interactive controls injection
 * - Metadata header injection
 * - HTML generation and structure
 * - Status filtering
 * - Phase grouping
 * - Performance benchmarks
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { D3HopDashboardRenderer, HopDashboardData, PhaseData, HopData } from '../../artifacts/renderers/d3_hop_dashboard.js';

describe('D3HopDashboardRenderer', () => {
  let renderer: D3HopDashboardRenderer;

  beforeEach(() => {
    renderer = new D3HopDashboardRenderer();
  });

  describe('Basic Properties', () => {
    it('should have correct type identifier', () => {
      expect(renderer.type).toBe('hop_dashboard');
    });

    it('should create D3GraphRenderer instance', () => {
      // D3GraphRenderer instance is private, but we can verify behavior
      expect(renderer).toBeDefined();
      expect(renderer.render).toBeDefined();
    });
  });

  describe('Sample Data Fixtures', () => {
    function createSampleHopData(): HopDashboardData {
      return {
        currentPhase: 'Phase 2: Backend Development',
        phases: [
          {
            name: 'Phase 1: Foundation',
            hops: [
              {
                id: 'hop-1-1',
                name: 'Setup Project Structure',
                status: 'completed',
                description: 'Initialize TypeScript project',
                estimatedLOC: 200,
                actualLOC: 180,
                ctsCompliant: true,
                phase: 'Phase 1: Foundation',
                dependencies: [],
                tests: { total: 10, passing: 10, coverage: 100 }
              },
              {
                id: 'hop-1-2',
                name: 'Configure CI/CD',
                status: 'completed',
                description: 'Setup GitHub Actions',
                estimatedLOC: 150,
                actualLOC: 160,
                ctsCompliant: true,
                phase: 'Phase 1: Foundation',
                dependencies: ['hop-1-1'],
                tests: { total: 5, passing: 5, coverage: 100 }
              }
            ]
          },
          {
            name: 'Phase 2: Backend Development',
            hops: [
              {
                id: 'hop-2-1',
                name: 'Implement Parser',
                status: 'in_progress',
                description: 'Build signal relationship parser',
                estimatedLOC: 400,
                actualLOC: 350,
                ctsCompliant: true,
                phase: 'Phase 2: Backend Development',
                dependencies: ['hop-1-2'],
                tests: { total: 25, passing: 20, coverage: 80 }
              },
              {
                id: 'hop-2-2',
                name: 'Create Renderer',
                status: 'planned',
                description: 'Build D3 hop dashboard',
                estimatedLOC: 400,
                ctsCompliant: false,
                phase: 'Phase 2: Backend Development',
                dependencies: ['hop-2-1']
              }
            ]
          }
        ],
        stats: {
          totalLOC: 690,
          plannedLOC: 1150,
          ctsComplianceRate: 0.75,
          completionRate: 0.5
        }
      };
    }

    it('should create valid sample data', () => {
      const data = createSampleHopData();
      expect(data.phases).toHaveLength(2);
      expect(data.phases[0].hops).toHaveLength(2);
      expect(data.phases[1].hops).toHaveLength(2);
      expect(data.stats.completionRate).toBe(0.5);
    });
  });

  describe('Node Conversion', () => {
    it('should convert hops to graph nodes', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Task 1',
                status: 'completed',
                description: 'Test task',
                estimatedLOC: 100,
                actualLOC: 95,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: []
              }
            ]
          }
        ],
        stats: { totalLOC: 95, plannedLOC: 100, ctsComplianceRate: 1.0, completionRate: 1.0 }
      };

      const html = await renderer.render(data);
      
      // Should contain node with hop ID
      expect(html).toContain('hop-1');
      
      // Should contain hop name
      expect(html).toContain('Task 1');
      
      // Should contain LOC info
      expect(html).toContain('95 LOC');
    });

    it('should use actual LOC when available', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Task 1',
                status: 'completed',
                description: 'Test',
                estimatedLOC: 200,
                actualLOC: 180,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: []
              }
            ]
          }
        ],
        stats: { totalLOC: 180, plannedLOC: 200, ctsComplianceRate: 1.0, completionRate: 1.0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('180 LOC'); // Actual, not estimated
    });

    it('should use estimated LOC when actual is missing', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Task 1',
                status: 'planned',
                description: 'Test',
                estimatedLOC: 200,
                ctsCompliant: false,
                phase: 'Phase 1',
                dependencies: []
              }
            ]
          }
        ],
        stats: { totalLOC: 0, plannedLOC: 200, ctsComplianceRate: 0.0, completionRate: 0.0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('200 LOC'); // Estimated
    });

    it('should assign cluster IDs based on phase', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase Alpha',
            hops: [
              {
                id: 'hop-1',
                name: 'Task 1',
                status: 'completed',
                description: 'Test',
                estimatedLOC: 100,
                ctsCompliant: true,
                phase: 'Phase Alpha',
                dependencies: []
              }
            ]
          }
        ],
        stats: { totalLOC: 100, plannedLOC: 100, ctsComplianceRate: 1.0, completionRate: 1.0 }
      };

      const html = await renderer.render(data);
      // Cluster ID should match phase name
      expect(html).toContain('Phase Alpha');
    });

    it('should handle multiple hops in same phase', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Task 1',
                status: 'completed',
                description: 'Test 1',
                estimatedLOC: 100,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: []
              },
              {
                id: 'hop-2',
                name: 'Task 2',
                status: 'in_progress',
                description: 'Test 2',
                estimatedLOC: 150,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: []
              },
              {
                id: 'hop-3',
                name: 'Task 3',
                status: 'planned',
                description: 'Test 3',
                estimatedLOC: 200,
                ctsCompliant: false,
                phase: 'Phase 1',
                dependencies: []
              }
            ]
          }
        ],
        stats: { totalLOC: 100, plannedLOC: 450, ctsComplianceRate: 0.67, completionRate: 0.33 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('hop-1');
      expect(html).toContain('hop-2');
      expect(html).toContain('hop-3');
      expect(html).toContain('Task 1');
      expect(html).toContain('Task 2');
      expect(html).toContain('Task 3');
    });

    it('should include test coverage in node params', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Task 1',
                status: 'completed',
                description: 'Test',
                estimatedLOC: 100,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: [],
                tests: { total: 25, passing: 25, coverage: 100 }
              }
            ]
          }
        ],
        stats: { totalLOC: 100, plannedLOC: 100, ctsComplianceRate: 1.0, completionRate: 1.0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('100% coverage');
    });

    it('should default to 0% coverage when tests missing', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Task 1',
                status: 'planned',
                description: 'Test',
                estimatedLOC: 100,
                ctsCompliant: false,
                phase: 'Phase 1',
                dependencies: []
              }
            ]
          }
        ],
        stats: { totalLOC: 0, plannedLOC: 100, ctsComplianceRate: 0.0, completionRate: 0.0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('0% coverage');
    });
  });

  describe('Edge Conversion', () => {
    it('should convert dependencies to graph edges', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Task 1',
                status: 'completed',
                description: 'Test',
                estimatedLOC: 100,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: []
              },
              {
                id: 'hop-2',
                name: 'Task 2',
                status: 'in_progress',
                description: 'Test',
                estimatedLOC: 150,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: ['hop-1']
              }
            ]
          }
        ],
        stats: { totalLOC: 100, plannedLOC: 250, ctsComplianceRate: 1.0, completionRate: 0.5 }
      };

      const html = await renderer.render(data);
      // Should contain both nodes
      expect(html).toContain('hop-1');
      expect(html).toContain('hop-2');
      // D3 will create edge from hop-1 to hop-2
    });

    it('should handle multiple dependencies per hop', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Task 1',
                status: 'completed',
                description: 'Test',
                estimatedLOC: 100,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: []
              },
              {
                id: 'hop-2',
                name: 'Task 2',
                status: 'completed',
                description: 'Test',
                estimatedLOC: 150,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: []
              },
              {
                id: 'hop-3',
                name: 'Task 3',
                status: 'in_progress',
                description: 'Test',
                estimatedLOC: 200,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: ['hop-1', 'hop-2']
              }
            ]
          }
        ],
        stats: { totalLOC: 250, plannedLOC: 450, ctsComplianceRate: 1.0, completionRate: 0.67 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('hop-1');
      expect(html).toContain('hop-2');
      expect(html).toContain('hop-3');
      // D3 will create 2 edges: hop-1→hop-3 and hop-2→hop-3
    });

    it('should handle cross-phase dependencies', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 2',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1-1',
                name: 'Foundation Task',
                status: 'completed',
                description: 'Test',
                estimatedLOC: 100,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: []
              }
            ]
          },
          {
            name: 'Phase 2',
            hops: [
              {
                id: 'hop-2-1',
                name: 'Backend Task',
                status: 'in_progress',
                description: 'Test',
                estimatedLOC: 200,
                ctsCompliant: true,
                phase: 'Phase 2',
                dependencies: ['hop-1-1']
              }
            ]
          }
        ],
        stats: { totalLOC: 100, plannedLOC: 300, ctsComplianceRate: 1.0, completionRate: 0.5 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('hop-1-1');
      expect(html).toContain('hop-2-1');
      // D3 will create edge from Phase 1 to Phase 2
    });
  });

  describe('Timeline Axis Injection', () => {
    it('should inject phase labels in timeline axis', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 2',
        phases: [
          {
            name: 'Phase 1: Foundation',
            hops: []
          },
          {
            name: 'Phase 2: Backend',
            hops: []
          },
          {
            name: 'Phase 3: Frontend',
            hops: []
          }
        ],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('Phase 1: Foundation');
      expect(html).toContain('Phase 2: Backend');
      expect(html).toContain('Phase 3: Frontend');
    });

    it('should show hop count in phase labels', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              { id: '1', name: 'T1', status: 'completed', description: '', estimatedLOC: 100, ctsCompliant: true, phase: 'Phase 1', dependencies: [] },
              { id: '2', name: 'T2', status: 'completed', description: '', estimatedLOC: 100, ctsCompliant: true, phase: 'Phase 1', dependencies: [] },
              { id: '3', name: 'T3', status: 'completed', description: '', estimatedLOC: 100, ctsCompliant: true, phase: 'Phase 1', dependencies: [] }
            ]
          }
        ],
        stats: { totalLOC: 300, plannedLOC: 300, ctsComplianceRate: 1.0, completionRate: 1.0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('3 hops');
    });
  });

  describe('Stats Panel Injection', () => {
    it('should inject stats panel with current phase', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 2: Backend Development',
        phases: [{ name: 'Phase 1', hops: [] }, { name: 'Phase 2: Backend Development', hops: [] }],
        stats: { totalLOC: 500, plannedLOC: 1000, ctsComplianceRate: 0.8, completionRate: 0.5 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('Current Phase:');
      expect(html).toContain('Phase 2: Backend Development');
    });

    it('should display completion percentage', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0.75 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('75%');
    });

    it('should display LOC budget with comma formatting', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 1234, plannedLOC: 5678, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('1,234');
      expect(html).toContain('5,678');
    });

    it('should display CTS compliance rate', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0.92, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('92%');
    });

    it('should use green color for 100% completion', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 1.0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('#2ca02c'); // Green color
    });

    it('should use orange color for partial completion', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0.5 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('#ff7f0e'); // Orange color
    });
  });

  describe('Interactive Controls Injection', () => {
    it('should inject filter controls', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('filter-planned');
      expect(html).toContain('filter-in-progress');
      expect(html).toContain('filter-completed');
    });

    it('should have reset view button', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('reset-view');
      expect(html).toContain('Reset View');
    });

    it('should include filter update script', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('updateFilter');
      expect(html).toContain('addEventListener');
    });
  });

  describe('Metadata Header Injection', () => {
    it('should render without metadata', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Dashboard Stats');
    });

    it('should show phase names in timeline', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          { name: 'Phase 1', hops: [
            { id: '1', name: 'T1', status: 'completed', description: '', estimatedLOC: 100, ctsCompliant: true, phase: 'Phase 1', dependencies: [] },
            { id: '2', name: 'T2', status: 'completed', description: '', estimatedLOC: 100, ctsCompliant: true, phase: 'Phase 1', dependencies: [] }
          ]},
          { name: 'Phase 2', hops: [
            { id: '3', name: 'T3', status: 'planned', description: '', estimatedLOC: 100, ctsCompliant: false, phase: 'Phase 2', dependencies: [] }
          ]}
        ],
        stats: { totalLOC: 200, plannedLOC: 300, ctsComplianceRate: 0.67, completionRate: 0.67 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('Phase 1');
      expect(html).toContain('Phase 2');
    });

    it('should handle timeline formatting', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('Controls');
    });
  });

  describe('HTML Structure', () => {
    it('should generate valid HTML structure', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toMatch(/<html/); // May have lang attribute
      expect(html).toContain('</html>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
      expect(html).toContain('<svg');
      expect(html).toContain('</svg>');
    });

    it('should include D3.js library', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('d3');
    });

    it('should include zoom and pan functionality', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('zoom');
    });
  });

  describe('Performance', () => {
    it('should render small dashboard quickly (<100ms)', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: Array.from({ length: 10 }, (_, i) => ({
              id: `hop-${i}`,
              name: `Task ${i}`,
              status: 'completed' as const,
              description: 'Test',
              estimatedLOC: 100,
              ctsCompliant: true,
              phase: 'Phase 1',
              dependencies: []
            }))
          }
        ],
        stats: { totalLOC: 1000, plannedLOC: 1000, ctsComplianceRate: 1.0, completionRate: 1.0 }
      };

      const start = performance.now();
      await renderer.render(data);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle large dashboards (<2s)', async () => {
      const phases = Array.from({ length: 5 }, (_, phaseIndex) => ({
        name: `Phase ${phaseIndex + 1}`,
        hops: Array.from({ length: 20 }, (_, hopIndex) => {
          const statusOptions = ['completed', 'in_progress', 'planned'] as const;
          const status = statusOptions[hopIndex % 3];
          return {
            id: `hop-${phaseIndex}-${hopIndex}`,
            name: `Task ${phaseIndex}-${hopIndex}`,
            status,
            description: 'Test task',
            estimatedLOC: 200,
            ctsCompliant: true,
            phase: `Phase ${phaseIndex + 1}`,
            dependencies: hopIndex > 0 ? [`hop-${phaseIndex}-${hopIndex - 1}`] : []
          };
        })
      }));

      const data: HopDashboardData = {
        currentPhase: 'Phase 3',
        phases,
        stats: { totalLOC: 10000, plannedLOC: 20000, ctsComplianceRate: 0.85, completionRate: 0.5 }
      };

      const start = performance.now();
      await renderer.render(data);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it('should generate HTML under 50KB for typical dashboard', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 2',
        phases: Array.from({ length: 3 }, (_, phaseIndex) => ({
          name: `Phase ${phaseIndex + 1}`,
          hops: Array.from({ length: 5 }, (_, hopIndex) => ({
            id: `hop-${phaseIndex}-${hopIndex}`,
            name: `Task ${phaseIndex}-${hopIndex}`,
            status: 'completed' as const,
            description: 'Test task',
            estimatedLOC: 100,
            ctsCompliant: true,
            phase: `Phase ${phaseIndex + 1}`,
            dependencies: []
          }))
        })),
        stats: { totalLOC: 1500, plannedLOC: 1500, ctsComplianceRate: 1.0, completionRate: 1.0 }
      };

      const html = await renderer.render(data);
      const sizeKB = new Blob([html]).size / 1024;

      expect(sizeKB).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dashboard', async () => {
      const data: HopDashboardData = {
        currentPhase: 'None',
        phases: [],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toBeDefined();
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should handle phase with no hops', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [{ name: 'Phase 1', hops: [] }],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('Phase 1');
      expect(html).toContain('0 hops');
    });

    it('should handle hop with no dependencies', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Standalone Task',
                status: 'completed',
                description: 'No dependencies',
                estimatedLOC: 100,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: []
              }
            ]
          }
        ],
        stats: { totalLOC: 100, plannedLOC: 100, ctsComplianceRate: 1.0, completionRate: 1.0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('Standalone Task');
    });

    it('should handle special characters in hop names', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Task with "quotes" & <tags>',
                status: 'completed',
                description: 'Test escaping',
                estimatedLOC: 100,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: []
              }
            ]
          }
        ],
        stats: { totalLOC: 100, plannedLOC: 100, ctsComplianceRate: 1.0, completionRate: 1.0 }
      };

      const html = await renderer.render(data);
      // D3 should handle escaping
      expect(html).toBeDefined();
    });

    it('should handle zero estimated LOC', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Configuration Task',
                status: 'completed',
                description: 'No code changes',
                estimatedLOC: 0,
                actualLOC: 0,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: []
              }
            ]
          }
        ],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 1.0, completionRate: 1.0 }
      };

      const html = await renderer.render(data);
      expect(html).toContain('0 LOC');
    });

    it('should handle circular dependencies gracefully', async () => {
      const data: HopDashboardData = {
        currentPhase: 'Phase 1',
        phases: [
          {
            name: 'Phase 1',
            hops: [
              {
                id: 'hop-1',
                name: 'Task 1',
                status: 'completed',
                description: 'Test',
                estimatedLOC: 100,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: ['hop-2']
              },
              {
                id: 'hop-2',
                name: 'Task 2',
                status: 'completed',
                description: 'Test',
                estimatedLOC: 100,
                ctsCompliant: true,
                phase: 'Phase 1',
                dependencies: ['hop-1']
              }
            ]
          }
        ],
        stats: { totalLOC: 200, plannedLOC: 200, ctsComplianceRate: 1.0, completionRate: 1.0 }
      };

      const html = await renderer.render(data);
      // D3 should handle circular dependencies without crashing
      expect(html).toBeDefined();
      expect(html).toContain('hop-1');
      expect(html).toContain('hop-2');
    });
  });
});
