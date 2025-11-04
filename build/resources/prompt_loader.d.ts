/**
 * PromptLoader
 * Loads and caches MCP resource prompts from JSON files
 */
import { Resource, ResourceContents } from '../types.js';
export declare class PromptLoader {
    private cache;
    /**
     * Load all prompts from a directory
     * @param dir - Directory path containing JSON prompt files
     * @returns Array of Resource objects
     */
    loadPromptsFromDirectory(dir: string): Promise<Resource[]>;
    /**
     * Read prompt content by URI
     * @param uri - Resource URI
     * @returns Resource contents
     * @throws Error if URI not found
     */
    readPromptContent(uri: string): Promise<ResourceContents>;
    /**
     * Validate prompt file structure
     * @param content - Parsed JSON content
     * @returns true if valid
     */
    validatePromptStructure(content: unknown): boolean;
    /**
     * Get all cached URIs
     * @returns Array of cached resource URIs
     */
    getCachedUris(): string[];
    /**
     * Clear the cache
     */
    clearCache(): void;
}
//# sourceMappingURL=prompt_loader.d.ts.map