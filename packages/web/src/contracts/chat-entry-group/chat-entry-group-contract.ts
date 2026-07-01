/**
 * PURPOSE: Defines grouped chat entry types for sub-agent chain collapsing in the chat UI
 *
 * USAGE:
 * const group: ChatEntryGroup = { kind: 'single', entry: chatEntry };
 * // Or: { kind: 'subagent-chain', agentId, description, taskToolUse, innerGroups, taskNotification, entryCount, contextTokens }
 * // innerGroups is recursive — a sub-agent chain can contain nested sub-agent chains with no depth cap
 */

import { z } from 'zod';

import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import { contextTokenCountContract } from '../context-token-count/context-token-count-contract';

const singleGroupContract = z.object({
  kind: z.literal('single'),
  entry: chatEntryContract,
});

const baseSubagentChainGroupContract = z.object({
  kind: z.literal('subagent-chain'),
  agentId: z.string().min(1).brand<'ChainAgentId'>(),
  description: z.string().brand<'ChainDescription'>(),
  taskToolUse: chatEntryContract.nullable(),
  taskNotification: chatEntryContract.nullable(),
  entryCount: z.number().int().nonnegative().brand<'ChainEntryCount'>(),
  contextTokens: contextTokenCountContract.nullable(),
});

export type SingleGroup = z.infer<typeof singleGroupContract>;
export type SubagentChainGroup = z.infer<typeof baseSubagentChainGroupContract> & {
  innerGroups: ChatEntryGroup[];
};
export type ChatEntryGroup = SingleGroup | SubagentChainGroup;

type SubagentChainGroupInput = z.input<typeof baseSubagentChainGroupContract> & {
  innerGroups: ChatEntryGroupInput[];
};
type ChatEntryGroupInput = z.input<typeof singleGroupContract> | SubagentChainGroupInput;

export const chatEntryGroupContract: z.ZodType<ChatEntryGroup, z.ZodTypeDef, ChatEntryGroupInput> =
  z.lazy(() =>
    z.union([
      singleGroupContract,
      baseSubagentChainGroupContract.extend({
        innerGroups: z.array(chatEntryGroupContract),
      }),
    ]),
  ) as unknown as z.ZodType<ChatEntryGroup, z.ZodTypeDef, ChatEntryGroupInput>;
