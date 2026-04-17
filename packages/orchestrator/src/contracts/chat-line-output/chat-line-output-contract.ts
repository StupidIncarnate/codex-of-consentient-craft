/**
 * PURPOSE: Defines the output types emitted by the chat line processor: fully-parsed ChatEntry arrays and agent ID patches
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

const chatLinePatchContract = z.object({
  type: z.literal('patch'),
  toolUseId: toolUseIdContract,
  agentId: agentIdContract,
});

export const chatLineOutputContract = z.discriminatedUnion('type', [
  chatLineEntriesContract,
  chatLinePatchContract,
]);

export type ChatLineOutput = z.infer<typeof chatLineOutputContract>;
export type ChatLineEntries = z.infer<typeof chatLineEntriesContract>;
export type ChatLinePatch = z.infer<typeof chatLinePatchContract>;
