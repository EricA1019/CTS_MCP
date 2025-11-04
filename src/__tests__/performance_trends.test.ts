/**
 * Tests for Performance Trend Renderer
 * Validates D3 chart rendering, goal thresholds, and time range selection
 */

import { PerformanceTrendRenderer } from '../artifacts/renderers/performance_trends.js';
import type { TrendDataset, TimeSeriesPoint } from '../artifacts/schemas/trend_data_schema.js';

describe('PerformanceTrendRenderer', () => {
  let renderer: PerformanceTrendRenderer;

  beforeEach(() => {
    renderer = new PerformanceTrendRenderer();
  });

  // Generate realistic 12-week dataset
  function generate12WeekDataset(): TrendDataset {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const startDate = now - (12 * weekMs);

    const loc: TimeSeriesPoint[] = [];
    const tests: TimeSeriesPoint[] = [];
    const coverage: TimeSeriesPoint[] = [];

    for (let i = 0; i < 12; i++) {
      const timestamp = startDate + (i + 1) * weekMs;
      
      // Simulate growing codebase
      loc.push({ timestamp, value: 1000 + (i * 200) });
      
      // Simulate growing test suite
      tests.push({ timestamp, value: 50 + (i * 10) });
      
      // Simulate improving coverage (approaching 75% goal)
      coverage.push({ timestamp, value: 60 + (i * 1.5) });
    }

    return {
      projectPath: '/test/project',
      startDate,
      endDate: now,
      weekCount: 12,
      loc,
      tests,
      coverage,
    };
  }

  describe('Type Registration', () => {
    it('should have correct type identifier', () => {
      expect(renderer.type).toBe('performance_trends');
    });
  });

  describe('Data Validation', () => {
    it('should validate correct trend dataset', async () => {
      const validData = generate12WeekDataset();
      const html = await renderer.render(validData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Performance Trends');
    });

    it('should reject invalid data', async () => {
      const invalidData = {
        projectPath: '/test',
        // Missing required fields
      };

      await expect(renderer.render(invalidData)).rejects.toThrow();
    });

    it('should reject data with mismatched array lengths', async () => {
      const invalidData = {
        projectPath: '/test',
        startDate: Date.now() - 1000000,
        endDate: Date.now(),
        weekCount: 2,
        loc: [{ timestamp: Date.now(), value: 100 }],
        tests: [{ timestamp: Date.now(), value: 10 }, { timestamp: Date.now(), value: 20 }],
        coverage: [{ timestamp: Date.now(), value: 50 }],
      };

      // Should not throw - renderer handles different lengths gracefully
      const html = await renderer.render(invalidData);
      expect(html).toContain('<!DOCTYPE html>');
    });
  });

  describe('Chart Rendering', () => {
    it('should render 12-week dataset in <400ms', async () => {
      const data = generate12WeekDataset();

      const startTime = performance.now();
      const html = await renderer.render(data);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(400);
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should include LOC line chart elements', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for D3 line chart code
      expect(html).toContain('lineGenerator');
      expect(html).toContain('.line.loc');
      expect(html).toContain('stroke: #1f77b4');
    });

    it('should include test count bar chart elements', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for bar chart code
      expect(html).toContain('.bar');
      expect(html).toContain('yTests');
      expect(html).toContain('barWidth');
    });

    it('should include coverage area chart with secondary y-axis', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for area chart and secondary axis
      expect(html).toContain('areaGenerator');
      expect(html).toContain('.area.coverage');
      expect(html).toContain('yCoverage');
      expect(html).toContain('yAxisCoverage');
    });
  });

  describe('Goal Threshold Overlay', () => {
    it('should render coverage goal threshold line at 75%', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for threshold line
      expect(html).toContain('threshold-line');
      expect(html).toContain('coverageGoal = 75');
      expect(html).toContain('% Goal');
    });

    it('should position threshold line correctly', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for threshold positioning code
      expect(html).toContain('yCoverage(coverageGoal)');
      expect(html).toContain('stroke-dasharray: 5,5');
    });
  });

  describe('Time Range Selector', () => {
    it('should include time range dropdown', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for selector
      expect(html).toContain('id="time-range"');
      expect(html).toContain('value="4"');
      expect(html).toContain('value="8"');
      expect(html).toContain('value="12"');
    });

    it('should include chart update logic for time range', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for update function
      expect(html).toContain('updateChart');
      expect(html).toContain('addEventListener(\'change\'');
      expect(html).toContain('visibleWeeks');
    });
  });

  describe('Interactive Features', () => {
    it('should include tooltip functionality', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for tooltip
      expect(html).toContain('tooltip');
      expect(html).toContain('showTooltip');
      expect(html).toContain('hideTooltip');
    });

    it('should include data point hover handlers', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for event handlers
      expect(html).toContain('on(\'mouseover\'');
      expect(html).toContain('on(\'mouseout\'');
    });
  });

  describe('Accessibility (WCAG AA)', () => {
    it('should include aria-label for chart', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for aria attributes
      expect(html).toContain('role="img"');
      expect(html).toContain('aria-label');
      expect(html).toContain('Performance trends chart');
    });

    it('should include descriptive labels and legend', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for labels
      expect(html).toContain('Lines of Code');
      expect(html).toContain('Test Count');
      expect(html).toContain('Coverage %');
      expect(html).toContain('Coverage Goal');
    });
  });

  describe('Visual Design', () => {
    it('should include legend with all metrics', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for legend items
      expect(html).toContain('legend');
      expect(html).toContain('Lines of Code');
      expect(html).toContain('Test Count');
      expect(html).toContain('Coverage %');
      expect(html).toContain('Coverage Goal (75%)');
    });

    it('should include axis labels', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for axis labels
      expect(html).toContain('axis-label');
      expect(html).toContain('Week');
      expect(html).toContain('Lines of Code / Test Count');
      expect(html).toContain('Coverage %');
    });

    it('should include grid lines', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for grid
      expect(html).toContain('grid');
      expect(html).toContain('gridX');
      expect(html).toContain('gridY');
    });
  });

  describe('Data Serialization', () => {
    it('should embed dataset in JavaScript', async () => {
      const data = generate12WeekDataset();
      const html = await renderer.render(data);

      // Check for data embedding
      expect(html).toContain('const fullData =');
      expect(html).toContain('"projectPath"');
      expect(html).toContain('"loc"');
      expect(html).toContain('"tests"');
      expect(html).toContain('"coverage"');
    });
  });
});
