/**
 * PURPOSE: Defines the structure for work item dependency replacement mapping
 *
 * USAGE:
 * const entry: ReplacementEntry = { oldId: QuestWorkItemIdStub(), newId: QuestWorkItemIdStub() };
 * // Used in questWorkItemInsertBroker for swapping dependsOn references
 */

import { z } from 'zod';

import { questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

export const replacementEntryContract = z.object({
  oldId: questWorkItemIdContract,
  newId: questWorkItemIdContract,
});

export type ReplacementEntry = z.infer<typeof replacementEntryContract>;
