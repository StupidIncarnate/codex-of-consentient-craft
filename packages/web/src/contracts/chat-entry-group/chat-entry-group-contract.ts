/**
 * PURPOSE: Defines grouped chat entry types for sub-agent chain collapsing in the chat UI
 *
 * USAGE:
 * const group: ChatEntryGroup = { kind: 'single', entry: chatEntry };
 * // Or: { kind: 'subagent-chain', agentId, description, taskToolUse, innerGroups, taskNotification, entryCount, contextTokens }
 */

import { z } from 'zod';

import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import { contextTokenCountContract } from '../context-token-count/context-token-count-contract';

const singleGroupContract = z.object({
  kind: z.literal('single'),
  entry: chatEntryContract,
});

const subagentChainGroupContract = z.object({
  kind: z.literal('subagent-chain'),
  agentId: z.string().min(1).brand<'ChainAgentId'>(),
  description: z.string().brand<'ChainDescription'>(),
  taskToolUse: chatEntryContract.nullable(),
  innerGroups: z.array(singleGroupContract),
  taskNotification: chatEntryContract.nullable(),
  entryCount: z.number().int().nonnegative().brand<'ChainEntryCount'>(),
  contextTokens: contextTokenCountContract.nullable(),
});

export const chatEntryGroupContract = z.discriminatedUnion('kind', [
  singleGroupContract,
  subagentChainGroupContract,
]);

export type ChatEntryGroup = z.infer<typeof chatEntryGroupContract>;
export type SingleGroup = z.infer<typeof singleGroupContract>;
export type SubagentChainGroup = z.infer<typeof subagentChainGroupContract>;
