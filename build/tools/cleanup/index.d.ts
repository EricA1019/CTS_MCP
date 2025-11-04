/**
 * CTS Cleanup Tool
 *
 * Safe filesystem cleanup with git validation, dry-run mode, and rollback support.
 * Integrates safety checks, cleanup strategies, and atomic file operations.
 */
export declare const cleanupTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectPath: {
                type: string;
                description: string;
            };
            strategies: {
                type: string;
                items: {
                    type: string;
                    enum: string[];
                };
                description: string;
                default: string[];
            };
            dryRun: {
                type: string;
                description: string;
                default: boolean;
            };
            requireCleanGit: {
                type: string;
                description: string;
                default: boolean;
            };
            exclusions: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
                default: string[];
            };
            maxActions: {
                type: string;
                description: string;
                default: number;
            };
        };
        required: string[];
    };
};
/**
 * Create MCP handler for cleanup tool
 */
export declare function createCleanupHandler(): (args: unknown) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;
//# sourceMappingURL=index.d.ts.map