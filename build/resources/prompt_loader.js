/**
 * PromptLoader
 * Loads and caches MCP resource prompts from JSON files
 */
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { z } from 'zod';
// Zod schema for prompt file validation
const PromptFileSchema = z.object({
    uri: z.string(),
    name: z.string(),
    description: z.string().optional(),
    content: z.string(),
});
export class PromptLoader {
    cache = new Map();
    /**
     * Load all prompts from a directory
     * @param dir - Directory path containing JSON prompt files
     * @returns Array of Resource objects
     */
    async loadPromptsFromDirectory(dir) {
        const resources = [];
        try {
            const resolvedDir = resolve(dir);
            const files = await fs.readdir(resolvedDir);
            for (const file of files) {
                if (!file.endsWith('.json'))
                    continue;
                const filePath = join(resolvedDir, file);
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    const promptData = JSON.parse(content);
                    // Validate structure
                    if (this.validatePromptStructure(promptData)) {
                        const validated = PromptFileSchema.parse(promptData);
                        // Cache the content
                        this.cache.set(validated.uri, validated.content);
                        // Create resource metadata
                        resources.push({
                            uri: validated.uri,
                            name: validated.name,
                            description: validated.description,
                            mimeType: 'text/plain',
                        });
                        console.error(`[PromptLoader] Loaded prompt: ${validated.uri}`);
                    }
                }
                catch (fileError) {
                    console.error(`[PromptLoader] Error loading ${file}:`, fileError);
                    // Continue loading other files
                }
            }
            console.error(`[PromptLoader] Loaded ${resources.length} prompts from ${resolvedDir}`);
            return resources;
        }
        catch (error) {
            console.error(`[PromptLoader] Error reading directory ${dir}:`, error);
            return [];
        }
    }
    /**
     * Read prompt content by URI
     * @param uri - Resource URI
     * @returns Resource contents
     * @throws Error if URI not found
     */
    async readPromptContent(uri) {
        const content = this.cache.get(uri);
        if (content === undefined) {
            throw new Error(`Resource not found: ${uri}`);
        }
        return {
            uri,
            mimeType: 'text/plain',
            text: content,
        };
    }
    /**
     * Validate prompt file structure
     * @param content - Parsed JSON content
     * @returns true if valid
     */
    validatePromptStructure(content) {
        try {
            PromptFileSchema.parse(content);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get all cached URIs
     * @returns Array of cached resource URIs
     */
    getCachedUris() {
        return Array.from(this.cache.keys());
    }
    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
}
//# sourceMappingURL=prompt_loader.js.map