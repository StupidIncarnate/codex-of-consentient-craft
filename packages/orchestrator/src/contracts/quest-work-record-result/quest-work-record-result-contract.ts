/**
 * PURPOSE: What `quest-work` hands back once one of its three record-bearing payloads —
 * `observations`, `outcome`, `request` — has been applied to `quest.json`. `plan`
 * and `amendment` return a separate, plan-file-shaped result (`{ operationItemId }`), because they
 * never touch this file at all.
 *
 * USAGE:
 * questWorkRecordResultContract.parse({ kind: 'outcome', word: 'done' });
 * // Returns: QuestWorkRecordResult
 */

import { z } from '#gateway/npm/zod';

import { stepOutcomeContract } from '../step-outcome/step-outcome-contract';

export const questWorkRecordResultContract = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('observations'),
      count: z.number().int().nonnegative().brand<'QuestWorkRecordResultCount'>(),
    })
    .brand<'QuestWorkRecordResult'>(),
  z
    .object({
      kind: z.literal('outcome'),
      word: stepOutcomeContract,
    })
    .brand<'QuestWorkRecordResult'>(),
  z
    .object({
      kind: z.literal('request'),
      step: z.string().min(1).brand<'QuestWorkRecordResultStep'>(),
    })
    .brand<'QuestWorkRecordResult'>(),
]);

export type QuestWorkRecordResult = z.infer<typeof questWorkRecordResultContract>;
