/**
 * PURPOSE: Defines a branded string type for MCP tool names
 *
 * USAGE:
 * const name: ToolName = toolNameContract.parse('discover');
 * // Returns a branded ToolName string type
 */
import { z } from 'zod';

export const toolNameContract = z.string().brand<'ToolName'>();

export type ToolName = z.infer<typeof toolNameContract>;
