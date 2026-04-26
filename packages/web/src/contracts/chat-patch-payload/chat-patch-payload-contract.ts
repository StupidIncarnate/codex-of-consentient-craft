/**
 * PURPOSE: Defines the payload shape carried by chat-patch WebSocket messages consumed by the web client
 *
 * USAGE:
 * chatPatchPayloadContract.parse({toolUseId: 'tool-1' as ToolUseId, agentId: 'agent-1' as AgentId});
 * // Returns ChatPatchPayload
 */

import { z } from 'zod';

export const chatPatchPayloadContract = z.object({
  toolUseId: z.string().min(1).brand<'ToolUseId'>(),
  agentId: z.string().min(1).brand<'AgentId'>(),
});

export type ChatPatchPayload = z.infer<typeof chatPatchPayloadContract>;
