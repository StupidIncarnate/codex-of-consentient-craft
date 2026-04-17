/**
 * PURPOSE: Defines a renderable chat item that is either a regular entry or a tool_use merged with its tool_result
 *
 * USAGE:
 * mergedChatItemContract.parse({kind: 'entry', entry: chatEntry});
 * mergedChatItemContract.parse({kind: 'tool-pair', toolUse: toolUseEntry, toolResult: resultEntry});
 * // Returns validated MergedChatItem for rendering
 */

import { z } from 'zod';

import { chatEntryContract } from '@dungeonmaster/shared/contracts';

const entryItemContract = z.object({
  kind: z.literal('entry'),
  entry: chatEntryContract,
});

const toolPairItemContract = z.object({
  kind: z.literal('tool-pair'),
  toolUse: chatEntryContract,
  toolResult: chatEntryContract.nullable(),
});

export const mergedChatItemContract = z.discriminatedUnion('kind', [
  entryItemContract,
  toolPairItemContract,
]);

export type MergedChatItem = z.infer<typeof mergedChatItemContract>;
