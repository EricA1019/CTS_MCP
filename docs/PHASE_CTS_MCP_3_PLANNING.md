# PHASE CTS_MCP_3: Cross-Project Signal Intelligence & Refactoring Automation
## Advanced signal analysis with project-wide tracking, unused signal detection, and AI-powered refactoring recommendations

**Status**: 🟡 PLANNING  
**Priority**: HIGH  
**Phase Duration**: 5-6 weeks (AI-assisted) | 12-14 weeks (traditional)  
**Dependencies**: Phase CTS_MCP_2 Complete  
**Phase Owner**: CTS MCP Development Team  
**Created**: 2025-10-30  
**Updated**: 2025-10-30  
**Target Start**: 2025-11-04  
**Target Completion**: 2025-12-13  
**Actual Start**: N/A  
**Actual Completion**: N/A

**Related Documentation**:
- **Project Vision**: CTS MCP Server for Godot Signal Architecture Analysis
- **Previous Phase**: [PHASE_CTS_MCP_2_COMPLETION_REPORT.md](./PHASE_CTS_MCP_2_COMPLETION_REPORT.md)
- **Next Phase**: PHASE_CTS_MCP_4_PLANNING.md (AI-Powered Code Generation)
- **Master Roadmap**: CTS_MCP_ROADMAP.md
- **Phase Index**: PHASE_CTS_MCP_3_INDEX.md

---

## 📋 Executive Summary

### Phase Vision

Phase 3 transforms the CTS MCP server from a **file-level signal parser** into a **project-wide signal intelligence system**. Building on Phase 2's AST-level parsing and clustering, Phase 3 extends analysis to entire Godot projects, tracking signal definitions, emissions, and connections across all `.gd` files. This enables detection of unused signals, orphaned connections, and refactoring opportunities—empowering developers to maintain clean, efficient signal architectures as projects grow.

**Strategic Importance**: Signal systems are the backbone of Godot architecture. As projects scale to 100+ scripts with 300+ signals, manual tracking becomes error-prone. Phase 3 automates signal architecture validation, enabling safe refactoring and preventing signal bloat.

**End State Vision**: Developers can:
1. **Visualize** the entire project's signal graph (all files, all connections)
2. **Detect** unused signals automatically (never emitted or connected)
3. **Refactor** safely with AI-powered rename/merge/delete suggestions
4. **Monitor** signal health with trend analysis and alerts
5. **Clean up** legacy code with confidence (no downstream breakage)

**User-Facing Impact**: 
- **Before Phase 3**: "I have 200 signals across 80 files. Are any unused? Which can I safely delete?"
- **After Phase 3**: One-click unused signal report, safe deletion suggestions, automated refactoring

### Problem Context

**Current State Before Phase 3** (Phase 2 capabilities):
- ✅ Single-file signal extraction with 100% accuracy
- ✅ Clustered visualization for <300 signals
- ✅ Dependency graph for file-level connections
- ❌ **No cross-file signal tracking** (can't find all `.emit()` calls project-wide)
- ❌ **No unused signal detection** (manual inspection required)
- ❌ **No refactoring automation** (risky manual renames/deletions)

**Pain Points Addressed**:
1. **Signal Bloat**: Projects accumulate 50-100 unused signals over time (10-20% of total)
   - Manual cleanup takes 4-8 hours per cleanup session
   - Risk of breaking working code (missed connections)
   - Phase 3 automates detection and safe deletion (30min cleanup)

2. **Refactoring Fear**: Developers avoid signal renames due to breakage risk
   - "I want to rename `player_health_changed` to `player_damaged` but it's used in 15 files"
   - Manual search-replace error rate: 15-20% (missed connections, typos)
   - Phase 3 provides AI-powered refactoring with 100% accuracy

3. **Signal Sprawl**: Similar signals with different names (`player_died` vs `player_death` vs `on_player_death`)
   - 20-30% of signals are near-duplicates
   - Consolidation requires manual analysis (2-3 hours per review)
   - Phase 3 detects duplicates and suggests merges (10min review)

**Opportunity Unlocked**: 
- Safe, automated signal architecture maintenance
- Confidence to refactor legacy code
- Prevention of signal bloat (continuous monitoring)
- 10x faster signal cleanup workflows

### Phase Scope Overview

**Total HOPs in Phase**: 7 HOPs (3 foundation + 3 features + 1 polish)  
**Total Sub-HOPs**: 4 sub-HOPs (2 complex HOPs split)  
**Estimated Total Lines**: 4,200 implementation + 2,800 tests + 900 documentation  
**Critical Path HOPs**: 3.1, 3.2a, 3.2b, 3.3, 3.7 (5 HOPs gate phase completion)

**Scope Breakdown**:
```
Foundation HOPs (3.1 - 3.2b): 3 HOPs (2 sub-HOPs), 2 weeks
├─ Cross-file signal tracking infrastructure
├─ Global signal graph construction
└─ Project-wide AST parsing optimization

Feature HOPs (3.3 - 3.5): 3 HOPs, 2.5 weeks
├─ Unused signal detection and reporting
├─ Refactoring suggestion engine
└─ Hierarchical clustering with labeling

Polish HOPs (3.6 - 3.7): 2 HOPs (2 sub-HOPs), 0.5 weeks
├─ Performance alerts and monitoring
├─ Documentation and completion report
└─ Production readiness validation
```

### Success Criteria (Phase-Level)

**Must-Have** (Phase Blockers - Cannot Complete Phase Without These):
- [ ] All 7 critical path HOPs completed (3.1, 3.2a, 3.2b, 3.3, 3.7)
- [ ] Project-wide signal tracking validates 500+ signal project (<5s scan time)
- [ ] Unused signal detection achieves ≥95% precision (low false positives)
- [ ] Refactoring suggestions achieve ≥98% accuracy (validated with test suite)
- [ ] Phase-level performance targets met (<5s project scan, <1s graph render)
- [ ] 0 compilation errors across all phase code (TypeScript strict mode)
- [ ] All 85+ phase tests passing (≥90% coverage minimum)
- [ ] Phase documentation complete (ADRs, signal contracts, completion report)

**Nice-to-Have** (Phase Enhancements - Defer to Phase 4 if Time-Constrained):
- [ ] Real-time signal monitoring (watch mode for project changes)
- [ ] GitHub integration (signal health checks in PRs)
- [ ] Signal naming convention linter
- [ ] Cross-project signal comparison (compare two Godot projects)

**Quality Gates**:
- [ ] Code review completion rate: 100%
- [ ] Test coverage: ≥90% (phase average, up from 93.6% in Phase 2)
- [ ] Signal contract compliance: 100% (all new signals documented)
- [ ] CTS compliance: 100% (all HOPs <750 lines, files <500 lines)
- [ ] Performance regression: 0% (no slowdowns vs Phase 2)
- [ ] False positive rate: <5% (unused signal detection)

**Documentation Gates**:
- [ ] 3 ADRs created (graph construction, refactoring engine, clustering v2)
- [ ] API documentation complete (all public methods typed and documented)
- [ ] Integration guides for cross-file tracking and refactoring
- [ ] Completion report with metrics, lessons learned, Phase 4 recommendations
- [ ] Migration guide from Phase 2 to Phase 3

---

## 🎯 Phase Goals & Objectives

### Strategic Goals (Why This Phase Exists)

1. **Enable Safe Signal Architecture Evolution**
   - **Strategic Value**: Godot projects evolve over 6-24 months. Signal architectures need continuous refactoring to prevent technical debt.
   - **Current Blocker**: Fear of breaking working code prevents refactoring (15-20% error rate with manual changes).
   - **Phase 3 Solution**: AI-powered refactoring with 98%+ accuracy enables confident evolution.
   - **Business Impact**: 10x faster refactoring workflows (30min vs 4-8 hours per cleanup session).

2. **Prevent Signal Bloat Through Automated Detection**
   - **Strategic Value**: Unused signals accumulate at 5-10 signals per month (10-20% of total over 12 months).
   - **Current Blocker**: Manual detection requires reviewing 500+ signals across 80+ files (4-8 hours per review).
   - **Phase 3 Solution**: Automated unused signal detection with ≥95% precision (<5% false positives).
   - **Business Impact**: Continuous monitoring prevents bloat (proactive vs reactive cleanup).

3. **Build Foundation for AI-Powered Code Generation (Phase 4)**
   - **Strategic Value**: Phase 4 will generate Godot code from natural language. Requires understanding of signal architecture.
   - **Current Blocker**: Phase 2 only understands single-file signals (can't generate cross-file signal connections).
   - **Phase 3 Solution**: Global signal graph enables validation of generated code (prevents invalid emissions/connections).
   - **Business Impact**: Phase 3 is prerequisite for Phase 4's AI code generation.

### Tactical Objectives (What This Phase Delivers)

**Foundation Objectives** (HOPs 3.1 - 3.2b):
- [ ] **HOP 3.1**: Project-wide AST parsing infrastructure
  - Scan all `.gd` files in project (<5s for 500-file project)
  - Incremental parsing (only changed files)
  - Cache invalidation on file changes
  - **Target**: <5s initial scan, <500ms incremental updates

- [ ] **HOP 3.2a**: Signal graph construction (definitions + emissions)
  - Track signal definitions across all files
  - Detect `.emit()` calls project-wide
  - Build emission graph (which signals emit which)
  - **Target**: Graph construction <1s for 300 signals

- [ ] **HOP 3.2b**: Signal graph construction (connections)
  - Detect `.connect()` calls project-wide
  - Track connection targets (method names, lambdas)
  - Build connection graph (who listens to what)
  - **Target**: Graph construction <1s for 500 connections

**Feature Objectives** (HOPs 3.3 - 3.5):
- [ ] **HOP 3.3**: Unused signal detection
  - Detect signals with zero `.emit()` calls (never emitted)
  - Detect signals with zero `.connect()` listeners (never connected)
  - Report with file locations and suggested deletions
  - **Target**: ≥95% precision, <5% false positives

- [ ] **HOP 3.4**: Refactoring suggestion engine
  - Similarity detection for duplicate signals (edit distance, semantic similarity)
  - Naming convention validation (snake_case, verb tense consistency)
  - Safe deletion suggestions (no downstream impact)
  - **Target**: ≥98% suggestion accuracy

- [ ] **HOP 3.5**: Hierarchical clustering with auto-labeling
  - 2-level clustering (clusters within clusters)
  - Theme detection (file prefix, signal prefix analysis)
  - Interactive drill-down UI
  - **Target**: <500ms clustering for 300 signals

**Quality Objectives** (Throughout Phase):
- [ ] Test coverage ≥90% across all phase code
- [ ] Performance budget: <5s project scan, <1s graph render
- [ ] Memory budget: <100MB total (including graph storage)
- [ ] Signal contract documentation: 100% compliance (6 new signals)
- [ ] CTS compliance: 100% (all HOPs/sub-HOPs validated)

### Non-Goals (Explicitly Out of Phase Scope)

> **Critical**: These are explicitly deferred to maintain phase focus and prevent scope creep.

**Deferred to Phase 4 (AI Code Generation)**:
- ❌ Natural language to GDScript code generation
- ❌ AI-powered signal architecture recommendations
- ❌ Automated test generation for signals
- ❌ Code completion based on signal context

**Deferred to Future Phases (Phase 5+)**:
- ❌ Real-time signal monitoring (watch mode for file changes)
- ❌ GitHub integration (signal health checks in PRs)
- ❌ Cross-project signal comparison
- ❌ Signal performance profiling (runtime overhead analysis)

**Permanently Out of Scope**:
- ❌ Godot Engine modification (we work with existing engine, not fork)
- ❌ Custom signal syntax (use standard GDScript signals)
- ❌ Automatic code refactoring (suggestions only, user approves)

**Rationale for Deferrals**:
- **Phase 4 Deferrals**: Require Phase 3's global signal graph as foundation. Cannot generate code without understanding project-wide signal architecture.
- **Phase 5+ Deferrals**: Nice-to-have features that don't block core value. Real-time monitoring requires filesystem watchers (complex). GitHub integration requires API authentication (scope creep).
- **Permanent Scope**: Engine modification violates "work with existing tools" principle. Auto-refactoring without approval is risky (user must review changes).

---

## 🗺️ Phase Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: CROSS-PROJECT SIGNAL INTELLIGENCE - SYSTEM ARCHITECTURE        │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Foundation Layer (HOPs 3.1 - 3.2b)                                  │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │ │
│  │  │ Project      │───▶│ Signal Graph │───▶│ Graph        │          │ │
│  │  │ Scanner      │    │ Builder      │    │ Cache        │          │ │
│  │  │ (3.1)        │    │ (3.2a, 3.2b) │    │              │          │ │
│  │  └──────────────┘    └──────────────┘    └──────────────┘          │ │
│  │       │                     │                    │                   │ │
│  │       │ Tree-sitter AST     │ Graph Data         │ Serialization    │ │
│  │       ▼                     ▼                    ▼                   │ │
│  │  All .gd files ────▶ Definitions ◀──┐      JSON Cache               │ │
│  │  in project           Emissions     │      (versioned)               │ │
│  │                       Connections ───┘                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                  │                                       │
│                                  ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Feature Layer (HOPs 3.3 - 3.5)                                      │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │ │
│  │  │ Unused       │◀───│ Refactoring  │◀───│ Hierarchical │          │ │
│  │  │ Detector     │    │ Engine       │    │ Clustering   │          │ │
│  │  │ (3.3)        │    │ (3.4)        │    │ (3.5)        │          │ │
│  │  └──────────────┘    └──────────────┘    └──────────────┘          │ │
│  │       │                     │                    │                   │ │
│  │       │ Graph Analysis      │ Suggestions        │ 2-Level Clusters │ │
│  │       ▼                     ▼                    ▼                   │ │
│  │  Zero emissions        Rename/Merge         Cluster Themes          │ │
│  │  Zero connections      Safe deletions       Drill-down UI           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                  │                                       │
│                                  ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Integration Layer (HOPs 3.6 - 3.7)                                  │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │ EventBus / SignalBus (Phase 3 Signal Contracts)               │  │ │
│  │  │  • project:scan_started(project_path, file_count)             │  │ │
│  │  │  • project:scan_completed(graph, scan_time)                   │  │ │
│  │  │  • analyzer:unused_detected(unused_signals, confidence)       │  │ │
│  │  │  • refactor:suggestion_generated(suggestion, accuracy)        │  │ │
│  │  │  • cluster:hierarchy_computed(root_cluster, depth)            │  │ │
│  │  │  • perf:degradation_alert(metric, old, new, threshold)        │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                  │                                       │
│                                  ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ External Integrations                                               │ │
│  │  • Phase 2: Tree-sitter Bridge, Signal Extractor                   │ │
│  │  • Phase 2: Clustered Signal Map Renderer (enhanced in 3.5)        │ │
│  │  • MCP Protocol: New tools (analyze_project, suggest_refactoring)  │ │
│  │  • VS Code: Webview for hierarchical cluster visualization         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phase-Level Signal Architecture

**CRITICAL**: Phase 3 signals enable project-wide analysis coordination.

```typescript
// EventBus signals (MCP server internal events)
// Location: src/signals/phase3_signals.ts
// Phase 3 Signal Contracts

/** Foundation Signals (HOPs 3.1 - 3.2b) **/

// Emitted when project scan begins
// @param project_path: Absolute path to Godot project root
// @param file_count: Number of .gd files to scan
// @param scan_mode: 'full' | 'incremental'
interface ProjectScanStartedPayload {
  project_path: string;
  file_count: number;
  scan_mode: 'full' | 'incremental';
  timestamp: number;
}
signal project:scan_started(payload: ProjectScanStartedPayload)

// Emitted when project scan completes successfully
// @param graph: Global signal graph (definitions, emissions, connections)
// @param scan_time: Total scan duration in milliseconds
// @param cache_hit_rate: Percentage of files served from cache
interface ProjectScanCompletedPayload {
  graph: SignalGraph;
  scan_time: number;
  cache_hit_rate: number;
  timestamp: number;
}
signal project:scan_completed(payload: ProjectScanCompletedPayload)

// Emitted when scan fails (parse errors, permissions, etc.)
// @param error: Error details
// @param files_scanned: Number of files processed before failure
interface ProjectScanFailedPayload {
  error: Error;
  files_scanned: number;
  failed_file: string | null;
  timestamp: number;
}
signal project:scan_failed(payload: ProjectScanFailedPayload)

/** Feature Signals (HOPs 3.3 - 3.5) **/

// Emitted when unused signals detected
// @param unused_signals: Array of signal definitions with zero usage
// @param confidence: Detection confidence (0-1, based on graph completeness)
interface UnusedDetectedPayload {
  unused_signals: Array<{
    name: string;
    file: string;
    line: number;
    reason: 'never_emitted' | 'never_connected' | 'both';
  }>;
  confidence: number;
  timestamp: number;
}
signal analyzer:unused_detected(payload: UnusedDetectedPayload)

// Emitted when refactoring suggestion generated
// @param suggestion: Refactoring recommendation
// @param accuracy: Estimated accuracy (0-1, based on similarity score)
interface RefactorSuggestionPayload {
  suggestion: {
    type: 'rename' | 'merge' | 'delete';
    target_signal: string;
    replacement: string | null;
    affected_files: string[];
    confidence: number;
  };
  accuracy: number;
  timestamp: number;
}
signal refactor:suggestion_generated(payload: RefactorSuggestionPayload)

// Emitted when hierarchical clustering completes
// @param root_cluster: Top-level cluster with nested children
// @param depth: Maximum cluster depth
// @param labels: Auto-generated cluster labels
interface HierarchyComputedPayload {
  root_cluster: ClusterNode;
  depth: number;
  labels: Map<number, string>;
  timestamp: number;
}
signal cluster:hierarchy_computed(payload: HierarchyComputedPayload)

/** Performance Signals (HOPs 3.6 - 3.7) **/

// Emitted when performance degradation detected
// @param metric: Performance metric name
// @param old_value: Previous measurement
// @param new_value: Current measurement
// @param threshold: Degradation threshold percentage
interface DegradationAlertPayload {
  metric: string;
  old_value: number;
  new_value: number;
  threshold: number;
  degradation_pct: number;
  timestamp: number;
}
signal perf:degradation_alert(payload: DegradationAlertPayload)

/** Phase Lifecycle Signals **/

// Emitted when Phase 3 systems initialized
signal phase3:ready()

// Emitted when Phase 3 shutting down
signal phase3:shutdown()
```

**Signal Contract Documentation**: All signals documented in `docs/signals/PHASE_3_SIGNAL_CONTRACTS.md`

### Major Components & Responsibilities

**Foundation Components** (HOPs 3.1 - 3.2b):

1. **Project Scanner** (`src/scanner/project_scanner.ts`) - HOP 3.1
   - **Responsibility**: Scan all `.gd` files in Godot project
   - **Input**: Project root path
   - **Output**: Array of AST trees (one per file)
   - **Performance**: <5s for 500-file project
   - **Caching**: Incremental scanning (only changed files)
   - **Dependencies**: Phase 2 TreeSitterBridge
   - **Signals Emitted**: `project:scan_started`, `project:scan_completed`, `project:scan_failed`

2. **Signal Graph Builder** (`src/graph/signal_graph_builder.ts`) - HOP 3.2a, 3.2b
   - **Responsibility**: Construct global signal graph from ASTs
   - **Input**: Array of AST trees
   - **Output**: `SignalGraph` (definitions, emissions, connections)
   - **Performance**: <1s for 300 signals
   - **Graph Structure**:
     ```typescript
     interface SignalGraph {
       definitions: Map<string, SignalDefinition[]>; // signal name → definitions (may be multiple files)
       emissions: Map<string, EmissionSite[]>;        // signal name → .emit() call sites
       connections: Map<string, ConnectionSite[]>;    // signal name → .connect() call sites
       orphans: string[];                             // signals defined but never used
     }
     ```
   - **Dependencies**: Phase 2 SignalExtractor
   - **Signals Emitted**: `project:scan_completed`

3. **Graph Cache Manager** (`src/graph/graph_cache.ts`) - HOP 3.1
   - **Responsibility**: Cache signal graphs with versioning
   - **Input**: `SignalGraph` + project metadata
   - **Output**: Serialized JSON cache
   - **Performance**: <100ms save/load for 300-signal graph
   - **Invalidation**: File mtime, parser version, graph schema version
   - **Dependencies**: Phase 2 Metadata system
   - **Signals Emitted**: `cache:invalidation_triggered`

**Feature Components** (HOPs 3.3 - 3.5):

4. **Unused Signal Detector** (`src/analysis/unused_detector.ts`) - HOP 3.3
   - **Responsibility**: Identify signals with zero usage
   - **Input**: `SignalGraph`
   - **Output**: Array of unused signals with reasons
   - **Algorithm**:
     ```
     for each signal_name in graph.definitions:
       if graph.emissions[signal_name].length == 0:
         flag as "never_emitted"
       if graph.connections[signal_name].length == 0:
         flag as "never_connected"
       if both flags set:
         flag as "orphan" (highest confidence)
     ```
   - **Performance**: <500ms for 300 signals
   - **Confidence Scoring**: 0.95 for orphans, 0.80 for single-flag
   - **Dependencies**: SignalGraph
   - **Signals Emitted**: `analyzer:unused_detected`

5. **Refactoring Engine** (`src/refactor/suggestion_engine.ts`) - HOP 3.4
   - **Responsibility**: Generate rename/merge/delete suggestions
   - **Input**: `SignalGraph` + coding standards
   - **Output**: Array of refactoring suggestions with accuracy scores
   - **Algorithms**:
     - **Similarity**: Levenshtein distance + semantic embedding (word2vec)
     - **Naming**: Snake_case validation, verb tense consistency
     - **Safety**: Impact analysis (count affected files/lines)
   - **Performance**: <1s for 300 signals
   - **Accuracy Target**: ≥98% (validated with test corpus)
   - **Dependencies**: SignalGraph
   - **Signals Emitted**: `refactor:suggestion_generated`

6. **Hierarchical Clusterer** (`src/clustering/hierarchical_clusterer.ts`) - HOP 3.5
   - **Responsibility**: 2-level clustering with auto-labeling
   - **Input**: `SignalGraph` nodes/edges
   - **Output**: `ClusterTree` (root + children)
   - **Algorithm**: Greedy modularity (Phase 2) → Recursive subdivision
   - **Labeling**: File prefix analysis (`player_*` → "Player Signals"), signal prefix detection
   - **Performance**: <500ms for 300 signals
   - **Dependencies**: Phase 2 CommunityDetection (enhanced)
   - **Signals Emitted**: `cluster:hierarchy_computed`

**Polish Components** (HOPs 3.6 - 3.7):

7. **Performance Monitor** (`src/monitoring/performance_monitor.ts`) - HOP 3.6
   - **Responsibility**: Track metrics and alert on degradation
   - **Input**: Performance samples from Phase 2 pipeline
   - **Output**: Alerts when metrics degrade >20%
   - **Metrics Monitored**: Scan time, graph build time, cluster time, memory usage
   - **Alert Thresholds**: Configurable (default 20% degradation)
   - **Dependencies**: Phase 2 PerformancePipeline
   - **Signals Emitted**: `perf:degradation_alert`

### Data Flow Diagram

```
Godot Project (500 .gd files)
    │
    ▼
[Project Scanner] ──signal:scan_started──▶ EventBus
    │ (HOP 3.1)
    │ Tree-sitter parse all files
    │ Incremental: only changed files
    ▼
AST Trees (cached)
    │
    ▼
[Signal Graph Builder] ──signal:scan_completed──▶ EventBus
    │ (HOP 3.2a, 3.2b)
    │ Extract: definitions, emissions, connections
    ▼
Global Signal Graph
    │
    ├──▶ [Unused Detector] ──signal:unused_detected──▶ EventBus
    │       │ (HOP 3.3)
    │       │ Identify zero-usage signals
    │       ▼
    │    Unused Signal Report
    │
    ├──▶ [Refactoring Engine] ──signal:suggestion_generated──▶ EventBus
    │       │ (HOP 3.4)
    │       │ Similarity + naming analysis
    │       ▼
    │    Refactoring Suggestions
    │
    └──▶ [Hierarchical Clusterer] ──signal:hierarchy_computed──▶ EventBus
            │ (HOP 3.5)
            │ 2-level clustering + labeling
            ▼
         Cluster Tree
            │
            ▼
    [D3 Renderer (enhanced)]
            │
            ▼
    Interactive Visualization (drill-down UI)
```

### Integration Points

**With Previous Phases**:
- **Phase 2 Integration**: Extends tree-sitter parsing from single-file to project-wide
  - Reuses: `TreeSitterBridge`, `SignalExtractor`, `ParserDiagnostics`
  - Enhances: `CommunityDetection` (hierarchical), `D3SignalMapV2` (drill-down)
  - New capability: Cross-file tracking (Phase 2 only understood single files)

**With Addons** (see `docs/Architecture/ADDON_MASTERLIST.md`):
- **Signal Lens**: Validates signal emission order in real-time
  - Phase 3 provides global graph → Signal Lens highlights unused signals in editor
  - Integration point: Export graph to Signal Lens format (JSON)

- **GUT Testing**: Tests refactoring suggestions with deterministic corpus
  - Phase 3 suggests rename → GUT validates all tests still pass
  - Integration point: Test suite validation API

**With External Systems** (MCP servers, CI/CD, etc.):
- **Shrimp MCP**: Export refactoring suggestions as Shrimp tasks
  - User reviews suggestions → Approve → Shrimp creates refactoring tasks
  - Integration point: `CTS_Export_to_Shrimp` tool (enhanced)

- **VS Code**: New webview for hierarchical cluster drill-down
  - Interactive tree navigation (expand/collapse clusters)
  - Integration point: `CTS_Render_Artifact` tool (new artifact type: `hierarchical_cluster`)

---

## 📊 Phase HOPs Breakdown

### HOP Dependency Graph

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 3 - HOP Dependency Graph                                           │
│                                                                           │
│  3.1 Project Scanner (Foundation)                                        │
│    │                                                                      │
│    ├──▶ 3.2a Signal Graph (Definitions + Emissions) ──┐                 │
│    │                                                    │                 │
│    └──▶ 3.2b Signal Graph (Connections) ───────────────┼──▶ 3.3 Unused  │
│                                                         │    Detector    │
│                                                         │       │        │
│                                                         ├──▶ 3.4 Refactor│
│                                                         │    Engine      │
│                                                         │       │        │
│                                                         └──▶ 3.5 Hierarch│
│                                                              Clustering  │
│                                                                  │        │
│  3.6a Performance Alerts ──────────────────────────────────┐    │        │
│                                                             │    │        │
│  3.6b Monitoring Dashboard ────────────────────────────────┼────┘        │
│                                                             │             │
│                                                             └──▶ 3.7 Final│
│                                                                  Polish   │
│                                                                           │
│  Critical Path (RED): 3.1 → 3.2a → 3.2b → 3.3 → 3.7                     │
│  Feature Track (BLUE): 3.4, 3.5 (parallel with 3.3)                      │
│  Polish Track (GREEN): 3.6a, 3.6b (parallel with 3.5)                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Critical Path HOPs (Must Complete for Phase Success)

#### HOP 3.1: Project-Wide Scanner Infrastructure
- **Purpose**: Scan all `.gd` files in Godot project and construct AST forest
- **Duration**: 12 hours
- **Dependencies**: Phase 2 complete (TreeSitterBridge)
- **Deliverables**: 
  - `ProjectScanner` class (250 LOC)
  - Incremental scanning logic (150 LOC)
  - Graph cache manager (200 LOC)
  - 15 tests
- **CTS Status**: ✅ Single HOP, 600 lines estimated (implementation + tests)
- **Planning Document**: [HOP_3_1_PROJECT_SCANNER.md](./hops/HOP_3_1_PROJECT_SCANNER.md)
- **Priority**: CRITICAL (blocks all graph construction)
- **Performance Target**: <5s for 500 files (initial scan), <500ms (incremental)

#### HOP 3.2a: Signal Graph Builder - Definitions & Emissions
- **Purpose**: Extract signal definitions and `.emit()` calls from AST forest
- **Duration**: 10 hours
- **Dependencies**: HOP 3.1
- **Deliverables**:
  - `SignalGraphBuilder` class (300 LOC)
  - Definition extraction (100 LOC)
  - Emission detection (150 LOC)
  - 12 tests
- **CTS Status**: ✅ Single HOP, 550 lines estimated
- **Planning Document**: [HOP_3_2a_GRAPH_BUILDER_DEFINITIONS.md](./hops/HOP_3_2a_GRAPH_BUILDER_DEFINITIONS.md)
- **Priority**: CRITICAL (enables unused detection)
- **Performance Target**: <1s for 300 signals

#### HOP 3.2b: Signal Graph Builder - Connections
- **Purpose**: Extract `.connect()` calls and build connection graph
- **Duration**: 10 hours
- **Dependencies**: HOP 3.2a
- **Deliverables**:
  - Connection detection (200 LOC)
  - Lambda connection handling (150 LOC)
  - Graph merging (100 LOC)
  - 12 tests
- **CTS Status**: ✅ Single HOP, 450 lines estimated
- **Planning Document**: [HOP_3_2b_GRAPH_BUILDER_CONNECTIONS.md](./hops/HOP_3_2b_GRAPH_BUILDER_CONNECTIONS.md)
- **Priority**: CRITICAL (completes signal graph)
- **Performance Target**: <1s for 500 connections

#### HOP 3.3: Unused Signal Detection Engine
- **Purpose**: Identify signals with zero emissions or connections
- **Duration**: 8 hours
- **Dependencies**: HOP 3.2b
- **Deliverables**:
  - `UnusedDetector` class (200 LOC)
  - Confidence scoring (100 LOC)
  - Report generation (150 LOC)
  - 10 tests
- **CTS Status**: ✅ Single HOP, 450 lines estimated
- **Planning Document**: [HOP_3_3_UNUSED_DETECTOR.md](./hops/HOP_3_3_UNUSED_DETECTOR.md)
- **Priority**: CRITICAL (primary user value)
- **Accuracy Target**: ≥95% precision (<5% false positives)

#### HOP 3.7: Final Polish, Documentation & Completion
- **Purpose**: Integration testing, documentation, completion report
- **Duration**: 8 hours
- **Dependencies**: ALL previous HOPs complete
- **Deliverables**:
  - Integration tests (200 LOC)
  - Performance validation (100 LOC)
  - 3 ADRs (900 LOC documentation)
  - Completion report (500 LOC)
  - Migration guide (200 LOC)
- **CTS Status**: ✅ Single HOP, 400 lines code + 1600 lines docs
- **Planning Document**: [HOP_3_7_FINAL_POLISH.md](./hops/HOP_3_7_FINAL_POLISH.md)
- **Priority**: CRITICAL (phase cannot complete without this)
- **Quality Target**: 0 compilation errors, all tests passing

**Critical Path Total**: 48 hours (5 HOPs)

---

### Parallel Track HOPs (Can Develop Concurrently)

#### Feature Track: Refactoring & Clustering

**HOP 3.4: Refactoring Suggestion Engine**
- **Purpose**: Generate rename/merge/delete suggestions with accuracy scores
- **Duration**: 12 hours
- **Dependencies**: HOP 3.2b (needs signal graph)
- **Deliverables**:
  - `RefactoringEngine` class (350 LOC)
  - Similarity detection (Levenshtein + semantic) (200 LOC)
  - Naming convention validation (150 LOC)
  - 15 tests (with test corpus)
- **CTS Status**: ⚠️ Split into 3.4a (similarity), 3.4b (naming/safety) if >750 lines
- **Planning Document**: [HOP_3_4_REFACTORING_ENGINE.md](./hops/HOP_3_4_REFACTORING_ENGINE.md)
- **Priority**: MEDIUM (enhances Phase 3 but not MVP)
- **Parallel With**: HOP 3.3 (can develop simultaneously after 3.2b)
- **Accuracy Target**: ≥98% suggestion accuracy

**HOP 3.5: Hierarchical Clustering with Auto-Labeling**
- **Purpose**: 2-level clustering with theme detection for signal map
- **Duration**: 10 hours
- **Dependencies**: HOP 3.2b (needs signal graph)
- **Deliverables**:
  - `HierarchicalClusterer` class (250 LOC)
  - Theme detection (file/signal prefix analysis) (150 LOC)
  - D3 drill-down renderer enhancement (200 LOC)
  - 12 tests
- **CTS Status**: ✅ Single HOP, 600 lines estimated
- **Planning Document**: [HOP_3_5_HIERARCHICAL_CLUSTERING.md](./hops/HOP_3_5_HIERARCHICAL_CLUSTERING.md)
- **Priority**: MEDIUM (improves visualization quality)
- **Parallel With**: HOP 3.3, 3.4 (can develop simultaneously)
- **Performance Target**: <500ms for 300 signals

**Feature Track Total**: 22 hours (2 HOPs)

---

#### Polish Track: Performance Monitoring

**HOP 3.6a: Performance Degradation Alerts**
- **Purpose**: Automated alerts when metrics degrade >20%
- **Duration**: 6 hours
- **Dependencies**: HOP 3.1 (needs performance samples)
- **Deliverables**:
  - `PerformanceMonitor` class (150 LOC)
  - Threshold configuration (50 LOC)
  - Alert generation (100 LOC)
  - 8 tests
- **CTS Status**: ✅ Single HOP, 300 lines estimated
- **Planning Document**: [HOP_3_6a_PERF_ALERTS.md](./hops/HOP_3_6a_PERF_ALERTS.md)
- **Priority**: LOW (nice-to-have, can defer)
- **Parallel With**: ALL other HOPs (independent)

**HOP 3.6b: Performance Monitoring Dashboard**
- **Purpose**: Real-time dashboard for Phase 3 performance metrics
- **Duration**: 6 hours
- **Dependencies**: HOP 3.6a
- **Deliverables**:
  - Dashboard React component (200 LOC)
  - Metric visualization (D3 charts) (150 LOC)
  - 6 tests
- **CTS Status**: ✅ Single HOP, 350 lines estimated
- **Planning Document**: [HOP_3_6b_PERF_DASHBOARD.md](./hops/HOP_3_6b_PERF_DASHBOARD.md)
- **Priority**: LOW (defer to Phase 4 if time-constrained)
- **Parallel With**: ALL other HOPs (independent)

**Polish Track Total**: 12 hours (2 HOPs)

---

### Phase HOP Summary Table

| HOP ID | Name | Type | Duration | Dependencies | CTS Status | Priority | Can Parallelize |
|--------|------|------|----------|--------------|------------|----------|-----------------|
| 3.1 | Project Scanner | Foundation | 12h | Phase 2 | ✅ Single | CRITICAL | No (foundation) |
| 3.2a | Graph Builder (Defs) | Foundation | 10h | 3.1 | ✅ Single | CRITICAL | No (critical path) |
| 3.2b | Graph Builder (Conns) | Foundation | 10h | 3.2a | ✅ Single | CRITICAL | No (critical path) |
| 3.3 | Unused Detector | Feature | 8h | 3.2b | ✅ Single | CRITICAL | No (critical path) |
| 3.4 | Refactoring Engine | Feature | 12h | 3.2b | ⚠️ May split | MEDIUM | Yes (with 3.3, 3.5) |
| 3.5 | Hierarchical Clustering | Feature | 10h | 3.2b | ✅ Single | MEDIUM | Yes (with 3.3, 3.4) |
| 3.6a | Performance Alerts | Polish | 6h | 3.1 | ✅ Single | LOW | Yes (with all) |
| 3.6b | Performance Dashboard | Polish | 6h | 3.6a | ✅ Single | LOW | Yes (with all) |
| 3.7 | Final Polish | Polish | 8h | ALL | ✅ Single | CRITICAL | No (final HOP) |
| **TOTAL** | **7 HOPs (9 if splits)** | - | **82h** | - | **100% CTS** | - | **~27% Parallelizable** |

**Phase Timeline Scenarios**:
- **Sequential (1 developer)**: 82 hours (~10 days) 
- **Parallel (2 developers)**: 60 hours (~7.5 days) (Critical Path + Feature Track)
- **Parallel (3 developers)**: 54 hours (~7 days) (Critical + Feature + Polish)

---

## 🎯 CTS Compliance Analysis (Phase-Level)

### Phase Scope Validation

**Total Estimated Lines** (All HOPs Combined):
- **Implementation**: 4,200 lines across 18 files
- **Tests**: 2,800 lines (100+ tests total, 15 test files)
- **Documentation**: 1,900 lines (HOPs + ADRs + API docs + completion report)
- **TOTAL**: 8,900 lines (phase deliverables)

**Per-HOP CTS Compliance**:
- ✅ **8** HOPs comply as single-HOP (<750 lines total, all files <500 lines)
- ⚠️ **1** HOP may split (3.4: Refactoring Engine, estimated 700 lines → may need 3.4a/3.4b)
- ✅ **0** Sub-HOPs currently (may become 1 if 3.4 splits)
- 🎯 **100%** CTS Compliance Rate (after potential split)

**Largest HOPs** (Risk Assessment):
| HOP ID | Estimated Lines | Status | Split Strategy (if needed) |
|--------|----------------|--------|----------------------------|
| 3.4 | 700 lines | ⚠️ MONITOR | If >750: 3.4a (similarity) + 3.4b (naming/safety) |
| 3.1 | 600 lines | ✅ SINGLE | Within budget, no split needed |
| 3.5 | 600 lines | ✅ SINGLE | Within budget, no split needed |

### Signal-First Compliance (Phase-Level)

**Phase Signal Budget**: 9 new signals total
- **Foundation Signals**: 3 signals (project:scan_started, scan_completed, scan_failed)
- **Feature Signals**: 3 signals (analyzer:unused_detected, refactor:suggestion_generated, cluster:hierarchy_computed)
- **Performance Signals**: 1 signal (perf:degradation_alert)
- **Lifecycle Signals**: 2 signals (phase3:ready, phase3:shutdown)

**Signal Allocation Per HOP**:
| HOP ID | Signals Introduced | Signal Purpose | Contract Documentation |
|--------|-------------------|----------------|------------------------|
| 3.1 | 3 | Scan lifecycle (started, completed, failed) | PHASE_3_SIGNAL_CONTRACTS.md |
| 3.3 | 1 | Unused signal detection results | PHASE_3_SIGNAL_CONTRACTS.md |
| 3.4 | 1 | Refactoring suggestions | PHASE_3_SIGNAL_CONTRACTS.md |
| 3.5 | 1 | Hierarchical clustering results | PHASE_3_SIGNAL_CONTRACTS.md |
| 3.6a | 1 | Performance degradation alerts | PHASE_3_SIGNAL_CONTRACTS.md |
| 3.7 | 2 | Phase lifecycle | PHASE_3_SIGNAL_CONTRACTS.md |
| **TOTAL** | **9 signals** | - | **100% Documented** |

**Signal-First Workflow** (Phase-Level):
1. **Step 1**: Define ALL 9 phase signals upfront (before any HOP implementation)
2. **Step 2**: Document signal contracts in `docs/signals/PHASE_3_SIGNAL_CONTRACTS.md`
3. **Step 3**: Each HOP implements a subset of phase signals
4. **Step 4**: Integration tests validate signal contracts between HOPs
5. **Step 5**: MCP client subscribes to signals for progress tracking

### Type Safety Compliance (Phase-Level)

**Type Safety Requirements** (TypeScript 5.0 strict mode):
- [ ] All function parameters typed: `function myFunc(param: Type): ReturnType`
- [ ] All variables explicitly typed: `const myVar: Type = value`
- [ ] Typed arrays throughout: `Array<ElementType>` not `Array`
- [ ] Async/Promise types: `async function(): Promise<ReturnType>`
- [ ] Null safety: Strict null checks enabled (`strictNullChecks: true`)
- [ ] Interface contracts: All public APIs use interfaces
- [ ] Zod validation: Runtime validation for MCP tool inputs

**TypeScript Compilation Validation** (All HOPs):
```bash
# Validate entire phase in strict mode
npm run build

# Expected result: 0 errors, 0 warnings
```

**Type Safety Enforcement Timeline**:
- **HOP Planning**: Type signatures defined in HOP plans
- **Implementation**: Types added as code is written (strict mode enforced)
- **Pre-Commit**: TypeScript compilation check before merging
- **CI/CD**: Automated TypeScript compilation in pipeline

### Testing Compliance (Phase-Level)

**Test Coverage Targets**:
- **Minimum Coverage**: 90% across all phase code (up from 93.6% in Phase 2)
- **Foundation HOPs**: 95% coverage minimum (critical systems)
- **Feature HOPs**: 90% coverage minimum (complex logic)
- **Integration Tests**: 20+ tests validating HOP interactions

**Test Distribution**:
| HOP ID | Unit Tests | Integration Tests | Performance Tests | Total Tests |
|--------|-----------|-------------------|-------------------|-------------|
| 3.1 | 12 | 3 | 2 | 17 |
| 3.2a | 10 | 2 | 1 | 13 |
| 3.2b | 10 | 2 | 1 | 13 |
| 3.3 | 8 | 2 | 1 | 11 |
| 3.4 | 12 | 3 | 2 | 17 |
| 3.5 | 10 | 2 | 1 | 13 |
| 3.6a | 6 | 2 | 1 | 9 |
| 3.6b | 5 | 1 | 0 | 6 |
| 3.7 | 5 | 15 | 5 | 25 |
| **TOTAL** | **78** | **32** | **14** | **124+ tests** |

**Jest Testing Patterns**:
- All tests use Jest 29.7 framework
- Deterministic test corpus (20 fixture projects)
- Graph construction tests with known ground truth
- Performance tests with budgets (<5s scan, <1s graph build)
- False positive validation (unused detection accuracy)

### Performance Budget (Phase-Level)

**Phase Performance Targets**:
- **Project Scan**: <5s for 500-file project (initial), <500ms (incremental)
- **Graph Construction**: <1s for 300 signals + 500 connections
- **Unused Detection**: <500ms for 300 signals
- **Refactoring Suggestions**: <1s for 300 signals
- **Hierarchical Clustering**: <500ms for 300 signals
- **Memory Budget**: <100MB total (including graph storage)

**Per-HOP Performance Budgets**:
| HOP ID | Frame Budget | Memory Budget | Validation Method |
|--------|-------------|---------------|-------------------|
| 3.1 | <5s (scan) | <50MB | Jest performance tests |
| 3.2a | <1s (graph) | <30MB | Graph construction benchmarks |
| 3.2b | <1s (graph) | <30MB | Connection graph benchmarks |
| 3.3 | <500ms | <10MB | Detection algorithm benchmarks |
| 3.4 | <1s | <20MB | Suggestion generation benchmarks |
| 3.5 | <500ms | <15MB | Clustering benchmarks (from Phase 2) |
| **TOTAL** | **<8.5s** | **<100MB** | **Continuous monitoring (Phase 2 pipeline)** |

---

## 📅 Phase Timeline & Milestones

### Phase Milestones

**M0: Phase Planning Complete** (Target: 2025-11-04)
- [ ] All 7 HOP planning documents created
- [ ] Signal contracts defined (9 signals documented)
- [ ] Performance budgets allocated
- [ ] CTS compliance validated (100%)
- [ ] Test corpus prepared (20 fixture projects)
- **Gate**: Cannot start implementation without M0 complete

**M1: Foundation Complete** (Target: 2025-11-18)
- [ ] HOPs 3.1, 3.2a, 3.2b complete
- [ ] Foundation tests passing (43/43 tests green)
- [ ] Project scanning operational (<5s for 500 files)
- [ ] Signal graph construction validated (<1s for 300 signals)
- [ ] Performance targets met (<6s total foundation)
- **Gate**: Cannot start feature HOPs without M1 complete

**M2: Features Complete** (Target: 2025-12-06)
- [ ] HOPs 3.3, 3.4, 3.5 complete
- [ ] Feature tests passing (41/41 tests green)
- [ ] Unused detection achieves ≥95% precision
- [ ] Refactoring suggestions achieve ≥98% accuracy
- [ ] Hierarchical clustering operational (<500ms)
- **Gate**: Cannot start polish HOP without M2 complete

**M3: Phase Complete** (Target: 2025-12-13)
- [ ] HOPs 3.6a, 3.6b, 3.7 complete
- [ ] ALL tests passing (124+/124+ tests green, ≥90% coverage)
- [ ] Performance budgets met (<8.5s total)
- [ ] Documentation complete (3 ADRs + API docs + completion report)
- [ ] Production deployment successful
- **Gate**: Phase 3 officially complete, can proceed to Phase 4

### Timeline Visualization

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Phase 3 Timeline - 6 Weeks Total (40h/week = 240h available)             │
│                                                                           │
│ Week 1-2: Foundation (M0 → M1) - 32h total                               │
│ ├─ 3.1: Project Scanner (12h)                                            │
│ ├─ 3.2a: Graph Builder Defs (10h)                                        │
│ └─ 3.2b: Graph Builder Conns (10h)                                       │
│                                                                           │
│ Week 3-4: Features (M1 → M2) - Parallel Development - 30h total          │
│ ├─ CRITICAL PATH: 3.3 Unused Detector (8h)                               │
│ ├─ FEATURE TRACK: 3.4 Refactoring Engine (12h) [parallel with 3.3/3.5]  │
│ └─ FEATURE TRACK: 3.5 Hierarchical Clustering (10h) [parallel with 3.3]  │
│                                                                           │
│ Week 5: Polish & Monitoring (M2 → M3) - Parallel - 12h total             │
│ ├─ POLISH TRACK: 3.6a Performance Alerts (6h) [parallel with 3.6b]       │
│ └─ POLISH TRACK: 3.6b Performance Dashboard (6h) [parallel with 3.6a]    │
│                                                                           │
│ Week 6: Final Polish (M2 → M3) - 8h total                                │
│ └─ 3.7: Final Polish & Documentation (8h)                                │
│                                                                           │
│ █ = Critical Path  ▓ = Feature Track  ░ = Polish Track                   │
│                                                                           │
│ Week:  1    2    3    4    5    6                                        │
│        ████████████                                                       │
│            ▓▓▓▓▓▓▓▓▓▓▓▓▓                                                  │
│                ░░░░░░░░                                                   │
│                        █████                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

**Timeline Scenarios**:
- **Sequential (1 developer, 40h/week)**: 82h ÷ 40 = ~2 weeks (M0 → M3)
- **Parallel (2 developers, 80h/week)**: 60h ÷ 80 = ~1 week (critical + feature)
- **Recommended (1 developer, realistic)**: 6 weeks (accounts for planning, testing, docs)

**Buffer Time** (for risks/unknowns):
- Planning Buffer: +10% (8 hours) - refactoring engine complexity
- Implementation Buffer: +15% (12 hours) - cross-file tracking edge cases
- Testing Buffer: +10% (8 hours) - false positive tuning for unused detection

### Critical Path Analysis

**Critical Path HOPs**: 3.1 → 3.2a → 3.2b → 3.3 → 3.7  
**Critical Path Duration**: 48 hours (gates phase completion)  
**Non-Critical HOPs**: 3.4, 3.5, 3.6a, 3.6b (can parallelize or defer)

**Risk Factors**:
1. **HOP 3.1 Risk**: Incremental scanning complexity (filesystем watchers, cache invalidation)
   - **Mitigation**: Start with full scan only, add incremental in 3.1b sub-hop if needed
   - **Fallback**: Defer incremental to Phase 4, accept 5s full scan per operation

2. **HOP 3.3 Risk**: False positive rate >5% (users lose trust in unused detection)
   - **Mitigation**: Conservative confidence scoring (flag ambiguous cases as "review needed")
   - **Fallback**: Manual review UI (user confirms deletions before applying)

3. **HOP 3.4 Risk**: Refactoring accuracy <98% (breaks user code)
   - **Mitigation**: Suggestions only (never auto-apply), extensive test corpus validation
   - **Fallback**: Defer to Phase 4 if accuracy target not met

---

## 📚 Documentation Requirements

**Architecture Decision Records** (3 ADRs, 900 LOC total):
1. **ADR-003: Cross-File Signal Graph Construction** (300 LOC)
   - Context: Single-file vs project-wide tracking
   - Decision: Incremental AST parsing with graph caching
   - Alternatives: Full re-scan, filesystem watchers, manual tracking
   - Consequences: Performance, cache invalidation complexity

2. **ADR-004: Refactoring Suggestion Engine Design** (350 LOC)
   - Context: Manual refactoring error rate 15-20%
   - Decision: Levenshtein + semantic similarity + naming validation
   - Alternatives: Rule-based only, ML-based, AST transformations
   - Consequences: Accuracy vs performance tradeoff

3. **ADR-005: Hierarchical Clustering Strategy** (250 LOC)
   - Context: Phase 2 flat clustering, users want drill-down
   - Decision: Recursive modularity optimization with theme detection
   - Alternatives: K-means hierarchical, agglomerative, manual grouping
   - Consequences: Cluster quality, labeling accuracy

**API Documentation** (500 LOC):
- TypeScript JSDoc for all public classes/methods
- Signal contracts with payload schemas
- Integration examples (how to use project scanner, unused detector)

**Guides** (500 LOC total):
- **Migration Guide**: Phase 2 → Phase 3 upgrade instructions
- **Refactoring Guide**: How to review and apply suggestions safely
- **Performance Tuning**: Optimizing scan time for large projects

**Completion Report** (600 LOC):
- Phase 3 metrics (LOC, tests, performance)
- Lessons learned (what worked, what didn't)
- Phase 4 recommendations

---

## 🚀 Success Metrics

**Performance Metrics**:
- Project scan: <5s for 500-file project ✅
- Graph construction: <1s for 300 signals ✅
- Unused detection: <500ms for 300 signals ✅
- Memory usage: <100MB total ✅

**Quality Metrics**:
- Test coverage: ≥90% ✅
- Unused detection precision: ≥95% ✅
- Refactoring accuracy: ≥98% ✅
- False positive rate: <5% ✅

**Delivery Metrics**:
- All 7 HOPs complete ✅
- 124+ tests passing ✅
- 0 TypeScript errors ✅
- 3 ADRs + completion report ✅

---

## 🔄 Phase 4 Preview

**Next Phase Focus**: AI-Powered Code Generation & Validation
- Natural language → GDScript signal code
- AI-generated signal connections validated against Phase 3 graph
- Automated test generation for refactored signals
- Code completion based on project signal architecture

**Phase 3 Enables Phase 4**:
- Global signal graph provides validation context
- Refactoring engine provides code transformation patterns
- Unused detection provides code quality baseline

---

**Phase 3 Status**: 🟡 PLANNING  
**Next Action**: Create HOP planning documents (7 HOPs)  
**Approval Required**: Phase 3 plan review (CTS MCP Development Team)

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-30  
**Next Review**: 2025-11-04 (M0 milestone)
