import type { AnySchema, ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface ToolDefinition<
  OutputArgs extends ZodRawShapeCompat | AnySchema,
  InputArgs extends undefined | ZodRawShapeCompat | AnySchema = undefined,
> {
  name: string;
  config: {
    title?: string;
    description: string;
    inputSchema?: InputArgs;
    outputSchema?: OutputArgs;
  };
  handler: ToolCallback<InputArgs>;
}
