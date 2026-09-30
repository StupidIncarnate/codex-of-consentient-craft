/**
 * PURPOSE: Defines the data `questGetQaChecklistBroker` returns
 *
 * USAGE:
 * questGetQaChecklistResultContract.parse(value);
 * // Returns validated QuestGetQaChecklistResult
 */
import { z } from '#gateway/npm/zod';
import { qaChecklistContract, verificationTrackContract } from '@dungeonmaster/shared/contracts';

export const questGetQaChecklistResultContract = z
  .object({ checklists: z.array(qaChecklistContract), track: verificationTrackContract.optional() })
  .brand<'QuestGetQaChecklistResult'>();

export type QuestGetQaChecklistResult = z.infer<typeof questGetQaChecklistResultContract>;
