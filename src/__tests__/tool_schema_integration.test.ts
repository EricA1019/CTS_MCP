/**
 * Tool Schema Integration Tests
 * 
 * Validates that tools return responses conforming to BaseToolResponse format
 * and that schema validation properly catches invalid responses.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { validateToolResponse } from '../schemas.js';
import { createScanSignalsHandler } from '../tools/scan_project_signals.js';
import { createBughunterHandler } from '../tools/bughunter/index.js';
import { ctsExportToShrimpHandler } from '../tools/cts_export_to_shrimp.js';
import { ArtifactEngine } from '../artifacts/artifact_engine.js';
import { tmpdir } from 'os';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Tool Schema Integration', () => {
  let testProjectPath: string;
  let artifactEngine: ArtifactEngine;

  beforeAll(() => {
    // Create temporary test project
    testProjectPath = join(tmpdir(), `cts_test_${Date.now()}`);
    mkdirSync(testProjectPath, { recursive: true });

    // Create minimal EventBus.gd
    const eventBusPath = join(testProjectPath, 'EventBus.gd');
    writeFileSync(
      eventBusPath,
      `extends Node

signal test_signal(value: int)
signal player_moved(position: Vector2)
`
    );

    // Initialize artifact engine (no config parameters)
    artifactEngine = new ArtifactEngine();
  });

  afterAll(() => {
    // Cleanup test project
    try {
      rmSync(testProjectPath, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('CTS_Scan_Project_Signals Schema Validation', () => {
    it('returns valid BaseToolResponse format', async () => {
      const handler = createScanSignalsHandler(artifactEngine);
      const response = await handler({
        projectPath: testProjectPath,
        renderMap: false,
      }) as any;

      // Validate required BaseToolResponse fields
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('toolName');
      expect(response.success).toBe(true);
      expect(response.toolName).toBe('CTS_Scan_Project_Signals');

      // Validate timestamp is ISO 8601 format
      expect(() => new Date(response.timestamp)).not.toThrow();
      expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
    });

    it('passes schema validation with valid response', async () => {
      const handler = createScanSignalsHandler(artifactEngine);
      const response = await handler({
        projectPath: testProjectPath,
        renderMap: false,
      });

      const { valid, errors } = validateToolResponse('CTS_Scan_Project_Signals', response);

      expect(valid).toBe(true);
      expect(errors).toBeUndefined();
    });

    it('includes result object with expected fields', async () => {
      const handler = createScanSignalsHandler(artifactEngine);
      const response = await handler({
        projectPath: testProjectPath,
        renderMap: false,
      }) as any;

      expect(response.result).toHaveProperty('projectPath');
      expect(response.result).toHaveProperty('totalSignals');
      expect(response.result).toHaveProperty('eventBusSignals');
      expect(response.result).toHaveProperty('signalBusSignals');
      expect(response.result).toHaveProperty('signals');
      expect(response.result).toHaveProperty('rendered');

      // Validate signals array structure
      expect(Array.isArray(response.result.signals)).toBe(true);
      if (response.result.signals.length > 0) {
        const signal = response.result.signals[0];
        expect(signal).toHaveProperty('name');
        expect(signal).toHaveProperty('file');
        expect(signal).toHaveProperty('line');
        expect(signal).toHaveProperty('source');
        expect(signal).toHaveProperty('params');
        expect(Array.isArray(signal.params)).toBe(true);
      }
    });

    it('rejects invalid response structure', () => {
      const invalidResponse = {
        success: true,
        // Missing timestamp
        toolName: 'CTS_Scan_Project_Signals',
        result: {
          // Missing required fields
        },
      };

      const { valid, errors } = validateToolResponse('CTS_Scan_Project_Signals', invalidResponse);

      expect(valid).toBe(false);
      expect(errors).toBeDefined();
    });
  });

  describe('CTS_Bughunter Schema Validation', () => {
    it('returns valid BaseToolResponse format', async () => {
      const handler = createBughunterHandler();
      const response = await handler({
        projectPath: testProjectPath,
        minSeverity: 'low',
        exportFormat: 'json',
      }) as any;

      // Validate required BaseToolResponse fields
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('toolName');
      expect(response).toHaveProperty('duration_ms');
      expect(response.success).toBe(true);
      expect(response.toolName).toBe('CTS_Bughunter');

      // Validate duration is a number
      expect(typeof response.duration_ms).toBe('number');
      expect(response.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('passes schema validation with valid response', async () => {
      const handler = createBughunterHandler();
      const response = await handler({
        projectPath: testProjectPath,
        minSeverity: 'low',
        exportFormat: 'json',
      });

      const { valid, errors } = validateToolResponse('CTS_Bughunter', response);

      expect(valid).toBe(true);
      expect(errors).toBeUndefined();
    });

    it('includes result object with bugs and stats', async () => {
      const handler = createBughunterHandler();
      const response = await handler({
        projectPath: testProjectPath,
        minSeverity: 'low',
        exportFormat: 'json',
      }) as any;

      expect(response.result).toHaveProperty('bugs');
      expect(response.result).toHaveProperty('stats');

      // Validate bugs array
      expect(Array.isArray(response.result.bugs)).toBe(true);

      // Validate stats structure
      expect(response.result.stats).toHaveProperty('totalBugs');
      expect(response.result.stats).toHaveProperty('bySeverity');
      expect(response.result.stats).toHaveProperty('byCategory');
      expect(response.result.stats).toHaveProperty('filesScanned');
      expect(response.result.stats).toHaveProperty('duration_ms');

      // Validate bySeverity is a record
      expect(typeof response.result.stats.bySeverity).toBe('object');
    });

    it('validates bug structure when bugs are found', async () => {
      // Create a file with intentional bugs
      const buggyFilePath = join(testProjectPath, 'buggy_script.gd');
      writeFileSync(
        buggyFilePath,
        `extends Node

func _ready():
    var x = null
    print(x.some_property)  # Null dereference
    
func calculate(a, b):
    return a / b  # Potential division by zero
`
      );

      const handler = createBughunterHandler();
      const response = await handler({
        projectPath: testProjectPath,
        minSeverity: 'low',
        exportFormat: 'json',
      }) as any;

      if (response.result.bugs.length > 0) {
        const bug = response.result.bugs[0];
        expect(bug).toHaveProperty('file');
        expect(bug).toHaveProperty('line');
        expect(bug).toHaveProperty('severity');
        expect(bug).toHaveProperty('category');
        expect(bug).toHaveProperty('message');

        // Validate severity enum
        expect(['low', 'medium', 'high', 'critical']).toContain(bug.severity);

        // Validate line is a positive number
        expect(typeof bug.line).toBe('number');
        expect(bug.line).toBeGreaterThan(0);
      }

      // Cleanup
      rmSync(buggyFilePath, { force: true });
    });
  });

  describe('Schema Validation Error Handling', () => {
    it('detects missing success field', () => {
      const invalidResponse = {
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Scan_Project_Signals',
        result: {},
      };

      const { valid, errors } = validateToolResponse('CTS_Scan_Project_Signals', invalidResponse);

      expect(valid).toBe(false);
      expect(errors).toBeDefined();
      expect(errors?.errors[0].path).toContain('success');
    });

    it('detects invalid timestamp format', () => {
      const invalidResponse = {
        success: true,
        timestamp: 'not-a-valid-timestamp',
        toolName: 'CTS_Scan_Project_Signals',
        result: {
          projectPath: '/test',
          totalSignals: 0,
          eventBusSignals: 0,
          signalBusSignals: 0,
          signals: [],
          rendered: false,
        },
      };

      const { valid, errors } = validateToolResponse('CTS_Scan_Project_Signals', invalidResponse);

      expect(valid).toBe(false);
      expect(errors).toBeDefined();
    });

    it('detects incorrect success literal value', () => {
      const invalidResponse = {
        success: false, // Should be `true` for successful responses
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Scan_Project_Signals',
        result: {
          projectPath: '/test',
          totalSignals: 0,
          eventBusSignals: 0,
          signalBusSignals: 0,
          signals: [],
          rendered: false,
        },
      };

      const { valid, errors } = validateToolResponse('CTS_Scan_Project_Signals', invalidResponse);

      expect(valid).toBe(false);
      expect(errors).toBeDefined();
    });

    it('detects missing result object', () => {
      const invalidResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Bughunter',
      };

      const { valid, errors } = validateToolResponse('CTS_Bughunter', invalidResponse);

      expect(valid).toBe(false);
      expect(errors).toBeDefined();
      expect(errors?.errors[0].path).toContain('result');
    });
  });

  describe('CTS_Export_to_Shrimp Schema Validation', () => {
    it('returns valid BaseToolResponse format', async () => {
      const hopPlan = {
        hopId: '5.1a',
        name: 'Test Hop',
        description: 'Test hop description',
        dependencies: [],
        estimatedLOC: 100,
        deliverables: ['Feature X'],
        acceptanceCriteria: ['Tests pass'],
        technicalNotes: 'Use pattern Y',
      };

      const result = await ctsExportToShrimpHandler({ hopPlan });
      const response = result as any;

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.timestamp).toBeDefined();
      expect(response.toolName).toBe('CTS_Export_to_Shrimp');
      expect(response.result).toBeDefined();
      expect(response.result.taskCount).toBe(1);
    });

    it('validates response with schema validator', async () => {
      const hopPlan = {
        hopId: '5.1a',
        name: 'Test Hop',
        description: 'Test description',
        dependencies: [],
        estimatedLOC: 100,
      };

      const result = await ctsExportToShrimpHandler({ hopPlan });
      const response = result as any;

      const { valid, errors } = validateToolResponse('CTS_Export_to_Shrimp', response);

      expect(valid).toBe(true);
      expect(errors).toBeUndefined();
    });

    it('includes all required result fields', async () => {
      const hopPlan = {
        hopId: '5.2b',
        name: 'Complex Hop',
        description: 'Test with sub-hops',
        dependencies: ['5.1a'],
        estimatedLOC: 500,
        subHops: [
          {
            id: 'a',
            name: 'Sub-hop A',
            description: 'First sub-hop',
            estimatedLOC: 200,
          },
        ],
      };

      const result = await ctsExportToShrimpHandler({ 
        hopPlan,
        generateSubTasks: true,
        updateMode: 'append'
      });
      const response = result as any;

      expect(response.result.message).toBeDefined();
      expect(response.result.conversionTime).toBeDefined();
      expect(response.result.taskCount).toBe(2); // Main + 1 sub-hop
      expect(response.result.updateMode).toBe('append');
      expect(response.result.shrimpTasksFormat).toHaveLength(2);
      expect(response.result.instructions).toBeInstanceOf(Array);
    });

    it('validates Shrimp task structure', async () => {
      const hopPlan = {
        hopId: '5.3c',
        name: 'Validation Test',
        description: 'Test task structure',
        dependencies: [],
        estimatedLOC: 150,
      };

      const result = await ctsExportToShrimpHandler({ hopPlan });
      const response = result as any;

      const task = response.result.shrimpTasksFormat[0];
      expect(task.name).toBeDefined();
      expect(task.description).toBeDefined();
      expect(task.implementationGuide).toBeDefined();
      expect(task.dependencies).toBeInstanceOf(Array);
      expect(task.relatedFiles).toBeInstanceOf(Array);
      expect(task.verificationCriteria).toBeDefined();

      // Validate related file structure
      expect(task.relatedFiles[0]).toHaveProperty('path');
      expect(task.relatedFiles[0]).toHaveProperty('type');
      expect(task.relatedFiles[0]).toHaveProperty('description');
    });
  });
});
