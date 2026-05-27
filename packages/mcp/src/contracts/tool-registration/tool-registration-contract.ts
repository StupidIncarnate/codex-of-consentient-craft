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
import { z } from 'zod';

import { toolDescriptionContract } from '../tool-description/tool-description-contract';
import { toolNameContract } from '../tool-name/tool-name-contract';
import type { ToolResponse } from '../tool-response/tool-response-contract';

export type ToolHandler = ({
  args,
  meta,
}: {
  args: Record<string, unknown>;
  meta?: Record<string, unknown>;
}) => Promise<ToolResponse>;

export const toolRegistrationContract = z.object({
  name: toolNameContract,
  description: toolDescriptionContract,
  inputSchema: z.record(z.string().brand<'InputSchemaKey'>(), z.unknown()),
});

export type ToolRegistration = z.infer<typeof toolRegistrationContract> & {
  handler: ToolHandler;
};
