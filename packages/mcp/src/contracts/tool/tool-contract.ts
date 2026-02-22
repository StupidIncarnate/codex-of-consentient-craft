/**
 * PURPOSE: Defines the schema for an MCP tool definition with name, description, and input schema
 *
 * USAGE:
 * const tool: Tool = toolContract.parse({ name: 'discover', description: 'Discover utilities...', inputSchema: {...} });
 * // Returns validated MCP tool definition
 */
import { z } from 'zod';

export const toolContract = z.object({
  name: z.string().brand<'ToolName'>(),
  description: z.string().brand<'ToolDescription'>(),
  inputSchema: z.unknown(),
});

export type Tool = z.infer<typeof toolContract>;
