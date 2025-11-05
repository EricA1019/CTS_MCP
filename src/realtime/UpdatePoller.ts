/**
 * Update Poller
 * 
 * Polling-based real-time update system for MCP-UI artifacts.
 * Tracks artifact changes and provides updates via MCP tool calls.
 * 
 * Architecture Decision: Use polling instead of SSE to avoid external HTTP server.
 * Trade-off: 2s latency vs 500ms SSE (acceptable for visualizations).
 * 
 * @module realtime/UpdatePoller
 */

/**
 * Types of artifact changes that can be tracked
 */
export type ArtifactChangeType = 'data_update' | 'filter_change' | 'theme_change';

/**
 * Artifact change event
 */
export interface ArtifactChange {
  /** Artifact ID that changed */
  artifactId: string;
  /** Type of change */
  type: ArtifactChangeType;
  /** Change payload (type-specific data) */
  payload: unknown;
  /** Timestamp when change occurred (Unix ms) */
  timestamp: number;
}

/**
 * Update poller configuration
 */
export interface UpdatePollerConfig {
  /** Maximum age for changes (ms) - older changes are purged */
  maxAge?: number;
  /** Maximum changes per artifact - older changes are dropped */
  maxChangesPerArtifact?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<UpdatePollerConfig> = {
  maxAge: 60000, // 1 minute
  maxChangesPerArtifact: 100,
};

/**
 * Polling-based update tracker for artifacts
 * 
 * Manages a change log for artifacts, allowing clients to poll for updates
 * since a specific timestamp. Automatically cleans up old changes to prevent
 * memory leaks.
 */
export class UpdatePoller {
  private changeLog: Map<string, ArtifactChange[]> = new Map();
  private config: Required<UpdatePollerConfig>;

  constructor(config: UpdatePollerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Record a change to an artifact
   * 
   * @param artifactId Artifact that changed
   * @param change Change details (without timestamp - added automatically)
   */
  recordChange(
    artifactId: string,
    change: Omit<ArtifactChange, 'artifactId' | 'timestamp'>
  ): void {
    const entry: ArtifactChange = {
      artifactId,
      type: change.type,
      payload: change.payload,
      timestamp: Date.now(),
    };

    // Initialize change log for artifact if needed
    if (!this.changeLog.has(artifactId)) {
      this.changeLog.set(artifactId, []);
    }

    const changes = this.changeLog.get(artifactId)!;
    changes.push(entry);

    // Enforce max changes limit
    if (changes.length > this.config.maxChangesPerArtifact) {
      changes.shift(); // Remove oldest
    }

    // Cleanup old changes across all artifacts
    this.cleanupOldChanges();
  }

  /**
   * Get updates for an artifact since a timestamp
   * 
   * @param artifactId Artifact to get updates for
   * @param since Timestamp to get updates after (Unix ms)
   * @returns Array of changes since timestamp (newest first)
   */
  getUpdates(artifactId: string, since: number): ArtifactChange[] {
    const changes = this.changeLog.get(artifactId) || [];
    return changes
      .filter((c) => c.timestamp > since)
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }

  /**
   * Get all updates across all artifacts since a timestamp
   * 
   * @param since Timestamp to get updates after (Unix ms)
   * @returns Array of all changes since timestamp (newest first)
   */
  getAllUpdates(since: number): ArtifactChange[] {
    const allChanges: ArtifactChange[] = [];
    
    for (const changes of this.changeLog.values()) {
      allChanges.push(...changes.filter((c) => c.timestamp > since));
    }
    
    return allChanges.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear all changes for an artifact
   * 
   * @param artifactId Artifact to clear
   */
  clearArtifact(artifactId: string): void {
    this.changeLog.delete(artifactId);
  }

  /**
   * Clear all changes across all artifacts
   */
  clearAll(): void {
    this.changeLog.clear();
  }

  /**
   * Get current change log size (for monitoring)
   * 
   * @returns Total number of tracked changes
   */
  getChangeCount(): number {
    let count = 0;
    for (const changes of this.changeLog.values()) {
      count += changes.length;
    }
    return count;
  }

  /**
   * Get number of tracked artifacts
   * 
   * @returns Number of artifacts with changes
   */
  getArtifactCount(): number {
    return this.changeLog.size;
  }

  /**
   * Cleanup old changes (older than maxAge)
   * 
   * Removes stale changes to prevent unbounded memory growth.
   * Called automatically after each recordChange().
   */
  private cleanupOldChanges(): void {
    const cutoff = Date.now() - this.config.maxAge;
    const artifactsToDelete: string[] = [];

    for (const [artifactId, changes] of this.changeLog.entries()) {
      // Filter out old changes
      const recentChanges = changes.filter((c) => c.timestamp > cutoff);

      if (recentChanges.length === 0) {
        // No recent changes, mark for deletion
        artifactsToDelete.push(artifactId);
      } else if (recentChanges.length < changes.length) {
        // Some changes removed, update array
        this.changeLog.set(artifactId, recentChanges);
      }
    }

    // Delete artifacts with no recent changes
    for (const artifactId of artifactsToDelete) {
      this.changeLog.delete(artifactId);
    }
  }
}

/**
 * Global update poller instance (singleton pattern)
 */
export const updatePoller = new UpdatePoller();
