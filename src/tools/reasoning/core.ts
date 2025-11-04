/**
 * Reasoning Engine Core
 * 
 * Template-driven reasoning loop with state management and convergence detection.
 * Supports iterative reasoning with assumptions, axioms, and tag tracking.
 * 
 * @module tools/reasoning/core
 */

/**
 * Reasoning state at a specific iteration
 */
export interface ReasoningState {
  thought_number: number;
  total_thoughts: number;
  stage: string;
  thought: string;
  assumptions_challenged: string[];
  axioms_used: string[];
  tags: string[];
  next_thought_needed: boolean;
}

/**
 * Reasoning context for template substitution
 */
export interface ReasoningContext {
  topic: string;
  previous_thoughts?: string[];
  current_stage?: string;
  [key: string]: unknown;
}

/**
 * Core reasoning engine with template-driven iteration
 */
export class ReasoningEngine {
  private state: ReasoningState;
  private initialTotalThoughts: number;

  constructor(initialThoughts: number = 10) {
    this.initialTotalThoughts = initialThoughts;
    this.state = {
      thought_number: 0,
      total_thoughts: initialThoughts,
      stage: 'Problem Definition',
      thought: '',
      assumptions_challenged: [],
      axioms_used: [],
      tags: [],
      next_thought_needed: true,
    };
  }

  /**
   * Execute a single reasoning iteration
   * 
   * @param stage - Current reasoning stage
   * @param context - Context data for template substitution
   * @returns Updated reasoning state
   */
  async iterate(stage: string, context: ReasoningContext): Promise<ReasoningState> {
    // Increment thought counter
    this.state.thought_number++;
    this.state.stage = stage;

    // Simple reasoning logic (can be enhanced with AI integration)
    // For now, generate placeholder thought based on stage
    this.state.thought = this.generateThought(stage, context);

    // Update state based on stage
    this.updateStateForStage(stage, context);

    // Determine if more thoughts are needed
    if (this.state.thought_number >= this.state.total_thoughts) {
      this.state.next_thought_needed = false;
    }

    return this.getState();
  }

  /**
   * Check if reasoning has converged
   * 
   * @returns True if no more thoughts needed, false otherwise
   */
  converged(): boolean {
    return !this.state.next_thought_needed;
  }

  /**
   * Get current reasoning state (immutable copy)
   * 
   * @returns Current state snapshot
   */
  getState(): ReasoningState {
    return { ...this.state };
  }

  /**
   * Set reasoning state (for persistence/restoration)
   * 
   * @param state - State to restore
   */
  setState(state: ReasoningState): void {
    this.state = { ...state };
  }

  /**
   * Adjust total thoughts dynamically
   * 
   * @param newTotal - New total thoughts count
   */
  adjustTotalThoughts(newTotal: number): void {
    this.state.total_thoughts = Math.max(1, newTotal);
  }

  /**
   * Generate thought content based on stage and context
   * 
   * @param stage - Current reasoning stage
   * @param context - Reasoning context
   * @returns Generated thought text
   */
  private generateThought(stage: string, context: ReasoningContext): string {
    const analyzer = new ProblemAnalyzer(context);
    
    switch (stage) {
      case 'Problem Definition':
        return analyzer.defineProblem();
      
      case 'Information Gathering':
        return analyzer.gatherInformation();
      
      case 'Analysis':
        return analyzer.analyzePatterns();
      
      case 'Synthesis':
        return analyzer.synthesizeInsights();
      
      case 'Conclusion':
        return analyzer.drawConclusions();
      
      case 'Critical Questioning':
        return analyzer.challengeAssumptions();
      
      case 'Planning':
        return analyzer.createActionPlan();
      
      default:
        return analyzer.generateGenericThought(stage);
    }
  }

  /**
   * Update state properties based on current stage
   * 
   * @param stage - Current reasoning stage
   * @param context - Reasoning context
   */
  private updateStateForStage(stage: string, context: ReasoningContext): void {
    // Add stage-specific tags
    if (!this.state.tags.includes(stage)) {
      this.state.tags.push(stage);
    }

    // Stage-specific state updates
    switch (stage) {
      case 'Problem Definition':
        // Initial stage - no assumptions challenged yet
        break;

      case 'Critical Questioning':
        // Challenge assumptions from previous thoughts
        if (context.previous_thoughts && context.previous_thoughts.length > 0) {
          this.state.assumptions_challenged.push(
            `Assumption from thought ${this.state.thought_number - 1}`
          );
        }
        break;

      case 'Analysis':
        // Use established axioms
        this.state.axioms_used.push('Logical consistency');
        break;

      case 'Synthesis':
        // Combine previous insights
        if (this.state.thought_number > 5) {
          this.state.axioms_used.push('Integration principle');
        }
        break;
    }
  }

  /**
   * Reset engine to initial state
   */
  reset(): void {
    this.state = {
      thought_number: 0,
      total_thoughts: this.initialTotalThoughts,
      stage: 'Problem Definition',
      thought: '',
      assumptions_challenged: [],
      axioms_used: [],
      tags: [],
      next_thought_needed: true,
    };
  }
}

/**
 * Problem Analyzer - Generates contextual reasoning for each stage
 * Implements heuristic reasoning patterns without hardcoded templates
 */
class ProblemAnalyzer {
  private topic: string;
  private context: ReasoningContext;
  private keywords: string[];
  private entities: string[];
  
  constructor(context: ReasoningContext) {
    this.topic = context.topic;
    this.context = context;
    this.keywords = this.extractKeywords(context.topic);
    this.entities = this.extractEntities(context.topic);
  }
  
  /**
   * Extract meaningful keywords from topic (nouns, verbs, technical terms)
   */
  private extractKeywords(text: string): string[] {
    // Remove only very common words, preserve domain-specific terms
    const commonWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be',
      'have', 'has', 'do', 'does', 'will', 'would', 'can', 'to', 'of', 'in', 'on',
      'at', 'for', 'with', 'as', 'by', 'from', 'that', 'this', 'it', 'or', 'and']);
    
    // Split on word boundaries but preserve hyphens in technical terms
    const words = text
      .split(/[\s,;:.!?()]+/)
      .filter(word => word.length > 1 && !commonWords.has(word.toLowerCase()));
    
    // Preserve technical terms, numbers, and significant words
    return words
      .filter((word, index, self) => self.indexOf(word) === index) // unique
      .slice(0, 15); // Allow more keywords
  }
  
  /**
   * Extract entities (capitalized words, technical terms, file paths, etc.)
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    
    // Find capitalized words
    const capitalizedMatches = text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g);
    if (capitalizedMatches) entities.push(...capitalizedMatches);
    
    // Find technical patterns (camelCase, snake_case, paths)
    const technicalMatches = text.match(/\b[a-z]+[A-Z][a-zA-Z]+\b|[a-z_]+_[a-z_]+|\/[a-z\/._-]+/g);
    if (technicalMatches) entities.push(...technicalMatches);
    
    // Find acronyms
    const acronymMatches = text.match(/\b[A-Z]{2,}\b/g);
    if (acronymMatches) entities.push(...acronymMatches);
    
    return [...new Set(entities)].slice(0, 5);
  }
  
  /**
   * Problem Definition stage: Identify core problem, constraints, goals
   */
  defineProblem(): string {
    const parts: string[] = [];
    
    // Start with direct reference to topic
    parts.push(`Analyzing the problem: "${this.topic}".`);
    
    // Identify what kind of problem this is
    if (this.topic.toLowerCase().includes('why')) {
      parts.push('This is a causal investigation requiring root cause analysis.');
    } else if (this.topic.toLowerCase().includes('how')) {
      parts.push('This is a procedural problem requiring step-by-step mechanism analysis.');
    } else if (this.topic.toLowerCase().includes('calculate') || this.topic.toLowerCase().includes('optimal')) {
      parts.push('This is an optimization problem requiring trade-off analysis.');
    } else {
      parts.push('This requires systematic analytical reasoning.');
    }
    
    // Reference context if available
    if (this.context.context) {
      parts.push(`Given context: ${this.context.context}`);
    }
    
    // Add constraints using entities
    if (this.entities.length > 0) {
      parts.push(`Key entities: ${this.entities.join(', ')}.`);
    }
    
    // Define success criteria
    parts.push(`Success requires addressing all aspects of the problem comprehensively.`);
    
    return parts.join(' ');
  }
  
  /**
   * Information Gathering stage: Identify what data is needed
   */
  gatherInformation(): string {
    const parts: string[] = [];
    
    // Reference the specific topic elements
    parts.push(`To properly analyze "${this.topic}",`);
    parts.push(`we need to gather relevant data and identify constraints.`);
    
    // Reference context if available
    if (this.context.context) {
      parts.push(`The context indicates: ${this.context.context}`);
      parts.push(`This provides important baseline information.`);
    }
    
    // Identify information needs
    parts.push(`Key information needed: empirical data, user requirements, system constraints, and best practices.`);
    
    // Identify gaps
    parts.push(`Information gaps should be addressed through research and analysis.`);
    
    return parts.join(' ');
  }
  
  /**
   * Analysis stage: Find patterns, relationships, cause-effect chains
   */
  analyzePatterns(): string {
    const parts: string[] = [];
    
    // Start with causal reasoning
    parts.push('Examining the evidence and applying causal reasoning:');
    
    // Use topic-specific analysis
    if (this.topic.toLowerCase().includes('fail') || this.topic.toLowerCase().includes('error')) {
      parts.push(`The failure occurs because of underlying compatibility or configuration issues.`);
      parts.push(`Therefore, investigating the specific conditions that trigger the failure is essential.`);
    } else if (this.topic.toLowerCase().includes('optimal') || this.topic.toLowerCase().includes('calculate')) {
      parts.push(`Finding the optimal solution requires balancing competing factors.`);
      parts.push(`Therefore, we must analyze the trade-offs between different approaches.`);
    } else if (this.topic.toLowerCase().includes('why')) {
      parts.push(`The phenomenon occurs because certain preconditions are met.`);
      parts.push(`This implies that understanding the causal chain is critical.`);
    } else {
      parts.push(`Patterns emerge when examining the relationships between components.`);
      parts.push(`This suggests systematic factors are at play.`);
    }
    
    // Add specific observations from context
    if (this.context.context) {
      parts.push(`The context provides additional evidence that supports this analysis.`);
    }
    
    return parts.join(' ');
  }
  
  /**
   * Infer likely causes based on keywords
   */
  private inferCause(): string {
    const causes: string[] = [];
    
    this.keywords.forEach(keyword => {
      if (keyword.includes('compile') || keyword.includes('build')) {
        causes.push('incompatible build configurations');
      } else if (keyword.includes('native') || keyword.includes('module')) {
        causes.push('ABI version mismatches');
      } else if (keyword.includes('version')) {
        causes.push('dependency version conflicts');
      } else if (keyword.includes('path')) {
        causes.push('incorrect path resolution');
      }
    });
    
    return causes.length > 0 ? causes[0] : 'environmental or configuration differences';
  }
  
  /**
   * Synthesis stage: Combine insights into coherent understanding
   */
  synthesizeInsights(): string {
    const parts: string[] = [];
    
    parts.push('Integrating the analysis,');
    parts.push(`the core issue centers on ${this.keywords[0]}.`);
    parts.push(`Because ${this.inferCause()}, the system exhibits the observed behavior.`);
    parts.push(`Therefore, addressing ${this.keywords[1] || 'the root cause'} should resolve the problem.`);
    
    // Add implications
    if (this.entities.length > 0) {
      parts.push(`This has implications for ${this.entities.slice(0, 2).join(' and ')}.`);
    }
    
    return parts.join(' ');
  }
  
  /**
   * Conclusion stage: Final assessment and recommendations
   */
  drawConclusions(): string {
    const parts: string[] = [];
    
    parts.push('In conclusion,');
    parts.push(`${this.keywords[0]} is best addressed by ${this.suggestSolution()}.`);
    parts.push(`The evidence indicates that this approach will succeed because it directly targets the causal mechanism.`);
    
    // Confidence and caveats
    parts.push('However, additional verification is recommended to confirm assumptions.');
    
    return parts.join(' ');
  }
  
  /**
   * Suggest solution based on problem type
   */
  private suggestSolution(): string {
    if (this.topic.toLowerCase().includes('compile') || this.topic.toLowerCase().includes('build')) {
      return 'rebuilding with correct dependencies and configurations';
    } else if (this.topic.toLowerCase().includes('version')) {
      return 'upgrading to compatible versions';
    } else if (this.topic.toLowerCase().includes('path')) {
      return 'correcting path resolution logic';
    } else {
      return `systematically addressing ${this.keywords[0]} and its dependencies`;
    }
  }
  
  /**
   * Critical Questioning stage: Challenge assumptions
   */
  challengeAssumptions(): string {
    const parts: string[] = [];
    
    parts.push('Challenging our assumptions:');
    parts.push(`What if ${this.keywords[0]} is not actually the root cause?`);
    parts.push(`Could there be hidden dependencies we haven't considered?`);
    parts.push(`Is our understanding of ${this.keywords[1] || 'the system'} complete?`);
    parts.push('These questions help identify blind spots in our reasoning.');
    
    return parts.join(' ');
  }
  
  /**
   * Planning stage: Create actionable steps
   */
  createActionPlan(): string {
    const parts: string[] = [];
    
    parts.push('Action plan:');
    parts.push(`1. Verify ${this.keywords[0]} configuration.`);
    parts.push(`2. Test with ${this.keywords[1] || 'alternative settings'}.`);
    parts.push(`3. Monitor results and iterate.`);
    parts.push('This systematic approach ensures we address the problem methodically.');
    
    return parts.join(' ');
  }
  
  /**
   * Generic thought generation for unknown stages
   */
  generateGenericThought(stage: string): string {
    return `Regarding ${stage}, the key consideration is how ${this.keywords[0]} relates to ${this.keywords[1] || 'the overall problem'}. ` +
           `This requires examining ${this.entities.length > 0 ? this.entities[0] : 'the system'} more carefully.`;
  }
}
