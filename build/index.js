#!/usr/bin/env node
/**
 * CTS MCP Server - Entry Point
 * Stdio transport for Model Context Protocol
 */
import { CTSMCPServer } from './server.js';
import { PromptLoader } from './resources/prompt_loader.js';
import { ALL_TOOL_PROMPTS } from './prompts/tool_prompts.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CTS MCP] Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('[CTS MCP] Uncaught Exception:', error);
    process.exit(1);
});
// Initialize server and prompt loader
const server = new CTSMCPServer();
const promptLoader = new PromptLoader();
// Load prompts from data/prompts directory
const promptsDir = join(__dirname, '..', 'data', 'prompts');
async function initializeServer() {
    try {
        const resources = await promptLoader.loadPromptsFromDirectory(promptsDir);
        // Register all loaded resources
        resources.forEach(resource => {
            server.registerResource(resource.uri, resource);
        });
        // Set the content provider for resources/read
        server.setResourceContentProvider((uri) => promptLoader.readPromptContent(uri));
        // Register all tool prompts
        ALL_TOOL_PROMPTS.forEach(prompt => {
            server.registerPrompt(prompt.name, prompt);
        });
        console.error('[CTS MCP] Server starting...');
        console.error('[CTS MCP] Protocol: stdio transport');
        console.error(`[CTS MCP] Loaded ${resources.length} resources`);
        console.error(`[CTS MCP] Loaded ${ALL_TOOL_PROMPTS.length} prompts`);
        console.error('[CTS MCP] Ready for requests');
    }
    catch (error) {
        console.error('[CTS MCP] Error loading prompts:', error);
        console.error('[CTS MCP] Server starting without prompts...');
    }
}
// Initialize server before handling requests
await initializeServer();
// Handle stdin data (MCP requests)
process.stdin.on('data', async (chunk) => {
    try {
        const input = chunk.toString().trim();
        if (!input)
            return;
        const request = JSON.parse(input);
        console.error(`[CTS MCP] Processing request: ${request.method}`);
        const response = await server.handleMessage(request);
        console.error(`[CTS MCP] Request complete, sending response`);
        // Write response to stdout (MCP client reads from here)
        process.stdout.write(JSON.stringify(response) + '\n');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('[CTS MCP] Error processing request:', errorMessage);
        if (errorStack) {
            console.error('[CTS MCP] Stack:', errorStack);
        }
        // Send error response
        const errorResponse = {
            jsonrpc: '2.0',
            id: null,
            error: {
                code: -32700,
                message: `Parse error: ${errorMessage}`,
            },
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
});
// Handle stdin close
process.stdin.on('end', () => {
    console.error('[CTS MCP] Client disconnected');
    process.exit(0);
});
// Handle process termination
process.on('SIGINT', () => {
    console.error('[CTS MCP] Shutting down...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.error('[CTS MCP] Shutting down...');
    process.exit(0);
});
// Keep process alive
process.stdin.resume();
//# sourceMappingURL=index.js.map