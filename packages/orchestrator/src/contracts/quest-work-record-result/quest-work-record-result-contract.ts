/**
 * PURPOSE: What `quest-work` hands back once one of its four record-bearing payloads —
 * `observations`, `outcome`, `invalidation`, `request` — has been applied to `quest.json`. `plan`
 * and `amendment` return a separate, plan-file-shaped result (`{ operationItemId }`), because they
 * never touch this file at all.
 *
 * USAGE:
 * questWorkRecordResultContract.parse({ kind: 'outcome', word: 'done' });
 * // Returns: QuestWorkRecordResult
 */

import {
  flowIdContract,
  questNoteIdContract,
  stepNameContract,
} from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { stepOutcomeContract } from '../step-outcome/step-outcome-contract';

export const questWorkRecordResultContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('observations'),
    count: z.number().int().nonnegative().brand<'ObservationCount'>(),
  }),
  z.object({
    kind: z.literal('outcome'),
    word: stepOutcomeContract,
  }),
  z.object({
    kind: z.literal('invalidation'),
    flowId: flowIdContract,
    noteId: questNoteIdContract,
    clearedCount: z.number().int().nonnegative().brand<'ClearedCount'>(),
  }),
  z.object({
    kind: z.literal('request'),
    step: stepNameContract,
  }),
]);

export type QuestWorkRecordResult = z.infer<typeof questWorkRecordResultContract>;
