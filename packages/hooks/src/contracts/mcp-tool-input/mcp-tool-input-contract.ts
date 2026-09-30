/**
 * PURPOSE: An MCP tool's input as Claude Code hands it to a hook — an object whose keys are
 *   whatever that tool declares. Reach for this over toolInputContract, which only admits the
 *   built-in Write, Edit and Bash shapes and would reject or strip an MCP tool's arguments.
 *
 * USAGE:
 * mcpToolInputContract.parse({ glob: 'packages/*' });
 * // Returns McpToolInput with every key kept
 */
import { z } from '#gateway/npm/zod';

export const mcpToolInputContract = z.record(z.string().brand<'McpToolInputKey'>(), z.json());

export type McpToolInput = z.infer<typeof mcpToolInputContract>;
