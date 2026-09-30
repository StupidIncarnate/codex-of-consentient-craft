/**
 * PURPOSE: Defines the data `questHumanVerdictRecordBroker` returns
 *
 * USAGE:
 * questHumanVerdictRecordResultContract.parse(value);
 * // Returns validated QuestHumanVerdictRecordResult
 */
import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questHumanVerdictRecordResultContract = z
  .object({ quest: questContract })
  .brand<'QuestHumanVerdictRecordResult'>();

export type QuestHumanVerdictRecordResult = z.infer<typeof questHumanVerdictRecordResultContract>;
