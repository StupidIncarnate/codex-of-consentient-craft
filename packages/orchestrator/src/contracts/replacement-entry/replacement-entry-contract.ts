/**
 * PURPOSE: Defines the structure for work item dependency replacement mapping
 *
 * USAGE:
 * const entry: ReplacementEntry = { oldId: QuestWorkItemIdStub(), newId: QuestWorkItemIdStub() };
 * // Used in questWorkItemInsertBroker for swapping dependsOn references
 */

import { z } from '#gateway/npm/zod';

import { workItemContract } from '@dungeonmaster/shared/contracts';

export const replacementEntryContract = z
  .object({
    oldId: workItemContract.shape.id,
    newId: workItemContract.shape.id,
  })
  .brand<'ReplacementEntry'>();

export type ReplacementEntry = z.infer<typeof replacementEntryContract>;
