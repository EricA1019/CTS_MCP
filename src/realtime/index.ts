/**
 * Realtime Updates Module
 * 
 * Polling-based real-time artifact updates for MCP-UI.
 * 
 * @module realtime
 */

export { UpdatePoller, updatePoller } from './UpdatePoller.js';
export type {
  ArtifactChange,
  ArtifactChangeType,
  UpdatePollerConfig,
} from './UpdatePoller.js';

export { generatePollingScript } from './polling_script.js';
export type { PollingScriptConfig } from './polling_script.js';
