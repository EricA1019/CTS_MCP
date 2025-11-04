# CTS_Reasoning Tool

## Overview

The `CTS_Reasoning` tool is a template-driven reasoning engine that supports flexible, multi-stage thinking processes with state management and convergence detection. It enables systematic problem analysis through six specialized reasoning stages, tracking assumptions, axioms, and thought progression.

This tool is designed for complex problem-solving scenarios where structured reasoning with iterative refinement is needed. It maintains full state across iterations, allowing for deep analysis with automatic convergence detection when sufficient reasoning has been achieved.

## Features

- **6 Reasoning Stages**: Problem Definition, Information Gathering, Analysis, Synthesis, Conclusion, Critical Questioning
- **State Management**: Persistent state tracking across iterations with thought accumulation
- **Convergence Detection**: Automatic detection when reasoning goals are met
- **Template-Driven Prompts**: Stage-specific prompt templates with variable substitution
- **Flexible Configuration**: Customizable stage sequences, iteration limits, and initial stages
- **Performance Optimized**: <500ms per iteration, suitable for real-time analysis

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | string | Yes | - | The topic or problem to reason about (minimum 5 characters) |
| `maxIterations` | number | No | 10 | Maximum number of reasoning iterations (1-50) |
| `initialStage` | string | No | "Problem Definition" | Starting reasoning stage (must be one of 6 valid stages) |
| `context` | string | No | - | Additional context or background information |
| `previousThoughts` | string[] | No | - | Previous thoughts to build upon |
| `stageSequence` | string[] | No | Default sequence | Custom sequence of reasoning stages |

### Valid Reasoning Stages

1. **Problem Definition** - Define the core problem, boundaries, constraints, and desired outcomes
2. **Information Gathering** - Collect relevant data, facts, research, and identify information gaps
3. **Analysis** - Examine patterns, relationships, implications, and cause-effect chains
4. **Synthesis** - Combine insights, build frameworks, connect concepts
5. **Conclusion** - Formulate final judgments, solutions, and actionable recommendations
6. **Critical Questioning** - Challenge assumptions, test logic, identify biases and weaknesses

## Response Structure

```typescript
{
  success: boolean;
  reasoning_chain: Array<{
    iteration: number;
    stage: string;
    thought: string;
    assumptions_challenged: string[];
    axioms_used: string[];
    tags: string[];
    next_thought_needed: boolean;
    prompt_used: string | null;
  }>;
  summary: {
    topic: string;
    total_iterations: number;
    converged: boolean;
    final_stage: string;
    total_assumptions_challenged: number;
    total_axioms_used: number;
    unique_tags: string[];
  };
  final_state: {
    thought_number: number;
    total_thoughts: number;
    stage: string;
    thought: string;
    assumptions_challenged: string[];
    axioms_used: string[];
    tags: string[];
    next_thought_needed: boolean;
  };
}
```

## Usage Examples

### Basic Usage

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "CTS_Reasoning",
    "arguments": {
      "topic": "How to improve code quality in a legacy codebase"
    }
  }
}
```

This will execute a full reasoning cycle through all 6 stages with default settings (10 max iterations).

### Advanced: Custom Stage Sequence

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "CTS_Reasoning",
    "arguments": {
      "topic": "Database query optimization strategies",
      "maxIterations": 8,
      "initialStage": "Information Gathering",
      "context": "PostgreSQL database with 10M+ rows, slow SELECT queries",
      "stageSequence": [
        "Information Gathering",
        "Analysis",
        "Synthesis",
        "Critical Questioning",
        "Conclusion"
      ]
    }
  }
}
```

This skips "Problem Definition" and goes directly to information gathering, using a custom stage flow.

### Continuation: Building on Previous Thoughts

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "CTS_Reasoning",
    "arguments": {
      "topic": "API design patterns for microservices",
      "maxIterations": 5,
      "previousThoughts": [
        "REST APIs provide good HTTP semantics",
        "GraphQL reduces over-fetching",
        "gRPC offers better performance for internal services"
      ],
      "context": "Building a distributed system with 15 microservices"
    }
  }
}
```

This continues reasoning from previous insights, maintaining context continuity.

## Integration with Other CTS Tools

### With CTS_Analyze_Project

Use reasoning to interpret signal analysis results:

```json
{
  "topic": "Signal architecture analysis results interpretation",
  "context": "Project has 142 signals, 23 orphans detected, 5 high-confidence refactorings suggested",
  "stageSequence": ["Analysis", "Synthesis", "Conclusion"]
}
```

### With Bughunter (Future)

Reason about detected bug patterns:

```json
{
  "topic": "Prioritizing 47 detected potential bugs",
  "context": "15 null check issues, 8 signal leaks, 12 error handling gaps, 7 type mismatches, 5 unfreed nodes",
  "maxIterations": 6
}
```

### With Audit (Future)

Analyze compliance violations:

```json
{
  "topic": "CTS compliance audit results - 12 violations found",
  "context": "File size violations: 3, Missing type hints: 5, Signal-first violations: 4",
  "stageSequence": ["Problem Definition", "Analysis", "Critical Questioning", "Conclusion"]
}
```

## Performance Characteristics

- **Iteration Time**: <500ms per iteration (validated via performance tests)
- **Full Cycle Time**: <3s for 6-stage reasoning cycle
- **Memory Usage**: Minimal - state objects are lightweight (<10KB typical)
- **Concurrency**: Stateless handler supports multiple concurrent calls
- **Scaling**: Linear performance degradation with iteration count

### Performance Tips

1. **Limit Iterations**: Use `maxIterations: 5` for quick analysis, increase for deep reasoning
2. **Custom Sequences**: Skip unnecessary stages to reduce total time
3. **Context Size**: Keep context strings under 5000 characters for optimal performance
4. **Previous Thoughts**: Limit to <50 previous thoughts to avoid slowdown

## Troubleshooting

### Common Issues

#### "Invalid reasoning parameters" Error

**Symptom**: Receives error code -32602 with validation errors

**Causes**:
- Topic string is less than 5 characters
- `maxIterations` is outside 1-50 range
- Invalid stage name in `stageSequence`
- Wrong data type for parameter (e.g., number for topic)

**Solution**: Validate input against parameter table above. Check error.data.validationErrors for details.

#### No Convergence After Max Iterations

**Symptom**: `summary.converged === false` after completing all iterations

**Causes**:
- `maxIterations` set too low for topic complexity
- Default convergence logic requires all iterations to complete

**Solution**: Increase `maxIterations` or adjust `total_thoughts` if using engine directly.

#### Empty Reasoning Chain

**Symptom**: `reasoning_chain` array is empty

**Causes**:
- Topic validation failed silently
- Stage sequence is empty array

**Solution**: Ensure topic meets minimum length, use default stage sequence.

#### Slow Performance (>500ms per iteration)

**Symptom**: Individual iterations take longer than expected

**Causes**:
- Very large `previousThoughts` array (>100 items)
- Extremely long topic string (>10000 characters)
- Context string is very large

**Solution**: Trim previous thoughts to most recent 20-30, summarize long context.

### Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| -32602 | Invalid params | Check parameter types and values against schema |
| -32603 | Internal error | Check error.message for details, may be runtime exception |

## Implementation Details

### Architecture

```
CTS_Reasoning Tool
├── core.ts - ReasoningEngine class with state management
├── prompts.ts - Template system with 6 stage definitions
├── index.ts - MCP tool wrapper with Zod validation
└── __tests__/
    ├── core.test.ts - 19 unit tests
    ├── integration.test.ts - 20 integration tests
    ├── performance.test.ts - 4 performance benchmarks
    └── edge_cases.test.ts - 23 edge case scenarios
```

### State Machine

The reasoning engine implements a simple state machine:

1. **Initialize**: `thought_number = 0`, `next_thought_needed = true`
2. **Iterate**: Increment thought, generate content, update tags/assumptions/axioms
3. **Check Convergence**: `thought_number >= total_thoughts`
4. **Converge**: Set `next_thought_needed = false`, return final state

### Template Variables

Prompts support `{{variable}}` placeholders:

- `{{topic}}` - Main reasoning topic
- `{{context}}` - Additional context
- `{{previous_thoughts}}` - Array of prior thoughts
- Custom variables can be added per-stage

Missing variables are replaced with `"(not provided)"`.

## Testing

The tool includes 66 comprehensive tests across 4 test files:

```bash
# Run all reasoning tests
npm test -- src/tools/reasoning

# Run specific test suites
npm test -- src/tools/reasoning/__tests__/core.test.ts
npm test -- src/tools/reasoning/__tests__/integration.test.ts
npm test -- src/tools/reasoning/__tests__/performance.test.ts
npm test -- src/tools/reasoning/__tests__/edge_cases.test.ts
```

**Test Coverage**:
- Unit tests: State management, iteration logic, template substitution
- Integration tests: Full MCP protocol flow, parameter validation, error handling
- Performance tests: <500ms iteration validation, concurrency
- Edge cases: Boundary conditions, invalid inputs, unicode, state consistency

## Future Enhancements

- **AI Integration**: Replace placeholder `generateThought()` with LLM calls
- **Resource Export**: Save reasoning chains as MCP resources for reference
- **Visualization**: Render reasoning DAG as interactive artifact
- **Collaborative Reasoning**: Multi-agent reasoning with expert personas
- **Persistence**: Save/load reasoning sessions across tool calls

## See Also

- [MCP Upgrade Plan](../../docs/mcp_upgrade_plan.md) - Tier 2B roadmap
- [CTS_Analyze_Project](./CTS_ANALYZE_PROJECT.md) - Signal analysis tool
- [Artifact Engine](../artifacts/README.md) - Visualization system
- [Expert Collaboration](../../expert_collaboration_mcp/README.md) - Multi-expert reasoning
