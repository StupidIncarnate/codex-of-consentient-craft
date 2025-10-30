/**
 * PURPOSE: Defines the schema for MCP tools/list response containing available tools
 *
 * USAGE:
 * const result: ToolListResult = toolListResultContract.parse({ tools: [{ name: 'discover', description: '...', inputSchema: {...} }] });
 * // Returns validated array of available MCP tools
 */
import { z } from 'zod';

const toolContract = z.object({
  name: z.string().brand<'ToolName'>(),
  description: z.string().brand<'ToolDescription'>(),
  inputSchema: z.unknown(),
});

export const toolListResultContract = z.object({
  tools: z.array(toolContract),
});

export type ToolListResult = z.infer<typeof toolListResultContract>;
