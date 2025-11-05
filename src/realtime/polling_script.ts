/**
 * Polling Script Generator
 * 
 * Generates client-side JavaScript for polling artifact updates.
 * Embedded in artifact HTML for real-time synchronization.
 * 
 * @module realtime/polling_script
 */

/**
 * Polling script configuration
 */
export interface PollingScriptConfig {
  /** Artifact ID to poll for */
  artifactId: string;
  /** Polling interval in milliseconds (default: 2000ms = 2s) */
  pollingInterval?: number;
  /** Whether to pause polling when tab is hidden (default: true) */
  pauseWhenHidden?: boolean;
  /** MCP server endpoint (if applicable) */
  mcpEndpoint?: string;
}

/**
 * Generate client-side polling script
 * 
 * Creates JavaScript code that polls for artifact updates and applies them.
 * Uses Page Visibility API to pause when hidden.
 * 
 * @param config Polling configuration
 * @returns JavaScript code string (wrapped in <script> tags)
 */
export function generatePollingScript(config: PollingScriptConfig): string {
  const {
    artifactId,
    pollingInterval = 2000,
    pauseWhenHidden = true,
    mcpEndpoint = '/mcp-tool',
  } = config;

  return `
<script>
  // Polling state
  let lastUpdateTimestamp = Date.now();
  let pollingIntervalId = null;
  const ARTIFACT_ID = '${artifactId}';
  const POLLING_INTERVAL = ${pollingInterval};
  const MCP_ENDPOINT = '${mcpEndpoint}';

  /**
   * Poll for artifact updates
   */
  async function pollForUpdates() {
    try {
      // Call MCP tool: CTS_Get_Artifact_Updates
      const response = await fetch(MCP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'CTS_Get_Artifact_Updates',
          params: {
            artifactId: ARTIFACT_ID,
            since: lastUpdateTimestamp
          }
        })
      });

      if (!response.ok) {
        console.error('Polling request failed:', response.status);
        return;
      }

      const result = await response.json();

      if (result.hasChanges && result.changes.length > 0) {
        console.log('[Polling] Received', result.changeCount, 'updates');
        applyUpdates(result.changes);
        lastUpdateTimestamp = result.serverTimestamp;
      }
    } catch (error) {
      console.error('[Polling] Error:', error);
    }
  }

  /**
   * Apply updates to the artifact
   * 
   * @param {Array} changes Array of change objects
   */
  function applyUpdates(changes) {
    changes.forEach(change => {
      console.log('[Polling] Applying change:', change.type);
      
      switch (change.type) {
        case 'data_update':
          if (typeof updateGraphData === 'function') {
            updateGraphData(change.payload);
          }
          break;
          
        case 'filter_change':
          if (typeof applyFilterState === 'function') {
            applyFilterState(change.payload);
          }
          break;
          
        case 'theme_change':
          if (typeof switchTheme === 'function') {
            switchTheme(change.payload);
          }
          break;
          
        default:
          console.warn('[Polling] Unknown change type:', change.type);
      }
    });
  }

  /**
   * Start polling
   */
  function startPolling() {
    if (pollingIntervalId) {
      console.warn('[Polling] Already running');
      return;
    }
    
    console.log('[Polling] Started (interval:', POLLING_INTERVAL, 'ms)');
    pollingIntervalId = setInterval(pollForUpdates, POLLING_INTERVAL);
    
    // Initial poll
    pollForUpdates();
  }

  /**
   * Stop polling
   */
  function stopPolling() {
    if (pollingIntervalId) {
      console.log('[Polling] Stopped');
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
  }

  // Page Visibility API integration (pause when hidden)
  ${
    pauseWhenHidden
      ? `
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('[Polling] Tab hidden - pausing');
      stopPolling();
    } else {
      console.log('[Polling] Tab visible - resuming');
      startPolling();
    }
  });
  `
      : ''
  }

  // Start polling on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPolling);
  } else {
    startPolling();
  }

  // Expose polling controls globally (for debugging)
  window.polling = {
    start: startPolling,
    stop: stopPolling,
    pollNow: pollForUpdates,
    getLastUpdate: () => new Date(lastUpdateTimestamp).toISOString(),
    isRunning: () => pollingIntervalId !== null
  };
</script>
`;
}
