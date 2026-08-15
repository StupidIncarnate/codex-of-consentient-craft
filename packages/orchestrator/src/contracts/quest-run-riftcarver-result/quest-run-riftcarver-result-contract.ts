/**
 * PURPOSE: What questRunRiftcarverBroker hands back to whichever dispatcher drove it. Reach for this
 * over questRunWardResultContract when the caller needs to know WHY a command item ended rather than
 * only that it did: a carve has three landing places (advance, spiritmender loop, blocked quest) and
 * `outcome` plus `failedStep` are the two fields that separate them, where ward's single exit code
 * carries the whole verdict.
 *
 * USAGE:
 * const result: QuestRunRiftcarverResult = questRunRiftcarverResultContract.parse({...});
 * // Returned once the carve has been persisted and the ledger outcome applied.
 */

import { z } from 'zod';

import {
  exitCodeContract,
  questIdContract,
  questWorkItemIdContract,
  riftcarverResultContract,
} from '@dungeonmaster/shared/contracts';

export const questRunRiftcarverResultContract = z.object({
  success: z.literal(true),
  questId: questIdContract,
  workItemId: questWorkItemIdContract,
  exitCode: exitCodeContract,
  riftcarverResultId: riftcarverResultContract.shape.id,
  outcome: riftcarverResultContract.shape.outcome,
  failedStep: riftcarverResultContract.shape.failedStep,
});

export type QuestRunRiftcarverResult = z.infer<typeof questRunRiftcarverResultContract>;
