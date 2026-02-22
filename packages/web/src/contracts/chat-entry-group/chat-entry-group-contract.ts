/**
 * PURPOSE: Defines grouped chat entry types for collapsing tool calls in the chat UI
 *
 * USAGE:
 * const group: ChatEntryGroup = { kind: 'single', entry: chatEntry };
 * // Or: { kind: 'tool-group', entries: [toolEntry1, toolEntry2], toolCount: 2, contextTokens: null, source: 'session' }
 */

import { z } from 'zod';

import { chatEntryContract } from '../chat-entry/chat-entry-contract';
import { contextTokenCountContract } from '../context-token-count/context-token-count-contract';

const singleGroupContract = z.object({
  kind: z.literal('single'),
  entry: chatEntryContract,
});

const toolGroupContract = z.object({
  kind: z.literal('tool-group'),
  entries: z.array(chatEntryContract),
  toolCount: z.number().int().nonnegative().brand<'ToolCount'>(),
  contextTokens: contextTokenCountContract.nullable(),
  source: z.enum(['session', 'subagent']),
});

const subagentChainGroupContract = z.object({
  kind: z.literal('subagent-chain'),
  agentId: z.string().min(1).brand<'ChainAgentId'>(),
  description: z.string().brand<'ChainDescription'>(),
  taskToolUse: chatEntryContract.nullable(),
  innerGroups: z.array(z.union([singleGroupContract, toolGroupContract])),
  taskNotification: chatEntryContract.nullable(),
  entryCount: z.number().int().nonnegative().brand<'ChainEntryCount'>(),
  contextTokens: contextTokenCountContract.nullable(),
});

export const chatEntryGroupContract = z.discriminatedUnion('kind', [
  singleGroupContract,
  toolGroupContract,
  subagentChainGroupContract,
]);

export type ChatEntryGroup = z.infer<typeof chatEntryGroupContract>;
export type SingleGroup = z.infer<typeof singleGroupContract>;
export type ToolGroup = z.infer<typeof toolGroupContract>;
export type SubagentChainGroup = z.infer<typeof subagentChainGroupContract>;
