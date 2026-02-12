/**
 * PURPOSE: Defines the response contract for the quest verify API endpoint with success flag and checks array
 *
 * USAGE:
 * questVerifyResultContract.parse({success: true, checks: [{name: 'deps', passed: true}]});
 * // Returns validated QuestVerifyResult object
 */

import { z } from 'zod';

import { questVerifyCheckContract } from '../quest-verify-check/quest-verify-check-contract';

export const questVerifyResultContract = z.object({
  success: z.boolean(),
  checks: z.array(questVerifyCheckContract),
});

export type QuestVerifyResult = z.infer<typeof questVerifyResultContract>;
