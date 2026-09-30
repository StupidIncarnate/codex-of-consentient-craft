/**
 * PURPOSE: Defines the types used by domain flows and the lifecycle flow for tool registration
 *
 * USAGE:
 * const registration: ToolRegistration = { name: 'discover', description: '...', inputSchema: {...}, handler: async ({ args, meta }) => response };
 * // ToolRegistration combines Zod-validated data fields with a handler function
 * // `meta` carries the MCP request's `params._meta` (loose object). Claude Code surfaces
 * // `claudecode/toolUseId` here on every tool call, enabling per-call caller identification
 * // even when N sub-agents share one MCP child. Most handlers can ignore it.
 */
import type { CallToolResult } from '#gateway/npm/modelcontextprotocol__sdk__types';
import { z } from '#gateway/npm/zod';

export type ToolHandler = ({
  args,
  meta,
}: {
  args: Record<string, unknown>;
  meta?: Record<string, unknown>;
}) => Promise<CallToolResult>;

export const toolRegistrationContract = z
  .object({
    name: z.string().brand<'ToolRegistrationName'>(),
    description: z.string().brand<'ToolRegistrationDescription'>(),
    inputSchema: z.record(z.string(), z.json()),
  })
  .brand<'ToolRegistration'>();

export type ToolRegistration = z.infer<typeof toolRegistrationContract> & {
  handler: ToolHandler;
};
