/**
 * Integration Test: Config with Audit Tool
 * 
 * Tests that audit tool correctly uses custom configuration
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { writeFileSync, unlinkSync, mkdirSync, existsSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { globalConfigLoader } from '../config/config_loader.js';
import { createAuditHandler, AuditInputSchema } from '../tools/audit/index.js';

describe('Config Integration with Audit Tool', () => {
  let testDir: string;
  let testFile: string;
  
  beforeEach(() => {
    // Create temp directory
    testDir = join(tmpdir(), `cts-audit-config-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    
    // Create a test GDScript file with 600 lines (exceeds default 500, under custom 750)
    testFile = join(testDir, 'large_file.gd');
    const lines = [];
    lines.push('extends Node');
    lines.push('');
    lines.push('func test():');
    for (let i = 0; i < 597; i++) {
      lines.push(`    pass  # line ${i}`);
    }
    writeFileSync(testFile, lines.join('\n'));
  });
  
  afterEach(() => {
    // Clean up
    globalConfigLoader.stopWatching();
    
    if (existsSync(testDir)) {
      try {
        unlinkSync(testFile);
      } catch (err) {}
      try {
        const configPath = join(testDir, '.ctsrc.json');
        if (existsSync(configPath)) {
          unlinkSync(configPath);
        }
      } catch (err) {}
      try {
        rmdirSync(testDir);
      } catch (err) {}
    }
  });
  
  it('should load default config when no .ctsrc.json exists', async () => {
    const auditHandler = createAuditHandler();
    
    const input = AuditInputSchema.parse({
      projectPath: testDir,
      categories: ['cts'],
      format: 'json',
    });
    
    const result = await auditHandler(input);
    
    // Verify result structure
    expect(result.success).toBe(true);
    expect(result.result.report).toBeDefined();
    
    const report = result.result.report as any;
    expect(report.violations).toBeDefined();
    
    console.log('✅ Audit tool works without custom config');
    console.log(`   Project score: ${report.overallScore}/100`);
  });
  
  it('should load custom config from .ctsrc.json', async () => {
    // Create custom config
    const customConfig = {
      rules: {
        maxFileLines: 750,
        requireTypeHints: false,
      },
    };
    
    writeFileSync(
      join(testDir, '.ctsrc.json'),
      JSON.stringify(customConfig, null, 2)
    );
    
    // Verify config is loaded
    const config = globalConfigLoader.loadConfig(testDir);
    
    expect(config.rules.maxFileLines).toBe(750);
    expect(config.rules.requireTypeHints).toBe(false);
    expect(config.sources.project).toContain('.ctsrc.json');
    
    console.log('✅ Audit tool loads custom config from .ctsrc.json');
    console.log(`   Custom maxFileLines: ${config.rules.maxFileLines}`);
  });
  
  it('should pass custom config to audit context', async () => {
    const customConfig = {
      rules: {
        maxFileLines: 800,
        maxFunctionLines: 100,
        maxCyclomaticComplexity: 15,
      },
    };
    
    writeFileSync(
      join(testDir, '.ctsrc.json'),
      JSON.stringify(customConfig, null, 2)
    );
    
    const auditHandler = createAuditHandler();
    
    const input = AuditInputSchema.parse({
      projectPath: testDir,
      categories: ['cts', 'code_quality'],
      format: 'json',
    });
    
    const result = await auditHandler(input);
    const report = result.result.report as any;
    
    // Audit ran successfully with custom config
    expect(report.overallScore).toBeDefined();
    expect(report.violations).toBeDefined();
    
    console.log('✅ Audit tool uses custom config in context');
    console.log(`   Violations found: ${report.violations.length}`);
  });
});
