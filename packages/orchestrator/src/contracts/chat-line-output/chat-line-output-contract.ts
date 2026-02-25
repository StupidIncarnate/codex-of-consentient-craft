/**
 * PURPOSE: Defines the output types emitted by the chat line processor: enriched entries and agent ID patches
 *
 * USAGE:
 * chatLineOutputContract.parse({ type: 'entry', entry: { type: 'assistant', message: {...} } });
 * // Returns validated ChatLineOutput
 */

import { z } from 'zod';

import { agentIdContract } from '../agent-id/agent-id-contract';
import { toolUseIdContract } from '../tool-use-id/tool-use-id-contract';

const chatLineEntryContract = z.object({
  type: z.literal('entry'),
  entry: z.record(z.unknown()),
});

const chatLinePatchContract = z.object({
  type: z.literal('patch'),
  toolUseId: toolUseIdContract,
  agentId: agentIdContract,
});

export const chatLineOutputContract = z.discriminatedUnion('type', [
  chatLineEntryContract,
  chatLinePatchContract,
]);

export type ChatLineOutput = z.infer<typeof chatLineOutputContract>;
export type ChatLineEntry = z.infer<typeof chatLineEntryContract>;
export type ChatLinePatch = z.infer<typeof chatLinePatchContract>;
