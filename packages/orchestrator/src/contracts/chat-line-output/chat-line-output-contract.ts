/**
 * PURPOSE: Defines the output types emitted by the chat line processor: fully-parsed ChatEntry arrays and sub-agent spawn signals
 *
 * USAGE:
 * chatLineOutputContract.parse({ type: 'entries', entries: [{ role: 'assistant', type: 'text', content: 'hi' }] });
 * // Returns validated ChatLineOutput
 */

import { z } from 'zod';

import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import { agentIdContract } from '../agent-id/agent-id-contract';
import { toolUseIdContract } from '../tool-use-id/tool-use-id-contract';

const chatLineEntriesContract = z.object({
  type: z.literal('entries'),
  entries: z.array(chatEntryContract),
});

// Emitted when the processor learns the "real" internal agentId Claude CLI assigned to a
// sub-agent — via `tool_use_result.agentId` on the parent stream's user tool_result line.
// Consumers (chat-spawn-broker) use this to start tailing the sub-agent's JSONL file so
// background activity also reaches the web. Not broadcast to the web — the web's chain
// grouping keys on `toolUseId`, not on the real internal agentId.
const chatLineAgentDetectedContract = z.object({
  type: z.literal('agent-detected'),
  toolUseId: toolUseIdContract,
  agentId: agentIdContract,
});

export const chatLineOutputContract = z.discriminatedUnion('type', [
  chatLineEntriesContract,
  chatLineAgentDetectedContract,
]);

export type ChatLineOutput = z.infer<typeof chatLineOutputContract>;
export type ChatLineEntries = z.infer<typeof chatLineEntriesContract>;
export type ChatLineAgentDetected = z.infer<typeof chatLineAgentDetectedContract>;
