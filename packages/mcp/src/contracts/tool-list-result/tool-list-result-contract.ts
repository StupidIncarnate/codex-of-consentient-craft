/**
 * PURPOSE: Defines the schema for MCP tools/list response containing available tools
 *
 * USAGE:
 * const result: ToolListResult = toolListResultContract.parse({ tools: [{ name: 'discover', description: '...', inputSchema: {...} }] });
 * // Returns validated array of available MCP tools
 */
import { z } from 'zod';

const jsonSchemaContract = z.object({
  type: z.string().brand<'JsonSchemaType'>(),
  properties: z.record(z.unknown()).optional(),
  required: z.array(z.string().brand<'PropertyName'>()).optional(),
  additionalProperties: z.boolean().optional(),
  $schema: z.string().brand<'SchemaUri'>().optional(),
});

const toolContract = z.object({
  name: z.string().brand<'ToolName'>(),
  description: z.string().brand<'ToolDescription'>(),
  inputSchema: jsonSchemaContract,
});

export const toolListResultContract = z.object({
  tools: z.array(toolContract),
});

export type ToolListResult = z.infer<typeof toolListResultContract>;
