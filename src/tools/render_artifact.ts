/**
 * CTS Render Artifact Tool
 * Renders artifacts using the ArtifactEngine
 */

import { z } from 'zod';
import { ToolDefinition, ToolHandler } from '../types.js';
import { ArtifactEngine } from '../artifacts/artifact_engine.js';
import { validateToolResponse, RenderArtifactResponseSchema } from '../schemas.js';
import { Errors } from '../errors.js';

const RenderArtifactParamsSchema = z.object({
  artifactType: z.enum(['signal_map', 'hop_dashboard']),
  data: z.unknown(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

/**
 * Create tool handler with ArtifactEngine instance
 */
export function createRenderArtifactHandler(engine: ArtifactEngine): ToolHandler {
  return async (args: Record<string, unknown>) => {
    const params = RenderArtifactParamsSchema.parse(args);

    const result = await engine.renderArtifact(
      params.artifactType,
      params.data,
      params.metadata
    );

    const response = {
      success: true as const,
      timestamp: new Date().toISOString(),
      toolName: 'CTS_Render_Artifact',
      result: {
        html: result.html,
        artifactType: params.artifactType,
        renderer: result.metadata.type, // Use metadata.type as renderer identifier
      },
    };

    // Validate response schema
    const { valid, errors } = validateToolResponse('CTS_Render_Artifact', response);
    if (!valid) {
      throw Errors.validationError(
        'response',
        'RenderArtifactResponse',
        errors?.errors[0]?.message || 'Invalid response structure'
      );
    }

    return response;
  };
}

/**
 * Tool definition for CTS_Render_Artifact
 */
export const renderArtifactTool: ToolDefinition = {
  name: 'CTS_Render_Artifact',
  description: 'Render CTS artifacts (signal maps, hop dashboards) as HTML for display in VS Code webview or browser',
  inputSchema: {
    type: 'object',
    properties: {
      artifactType: {
        type: 'string',
        description: 'Type of artifact to render',
        enum: ['signal_map', 'hop_dashboard'],
      },
      data: {
        type: 'object',
        description: 'Artifact data to render (structure varies by type)',
      },
      metadata: {
        type: 'object',
        description: 'Optional metadata for artifact',
        properties: {
          title: { type: 'string', description: 'Artifact title' },
          description: { type: 'string', description: 'Artifact description' },
        },
      },
    },
    required: ['artifactType', 'data'],
  },
};
