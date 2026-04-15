/**
 * PURPOSE: Defines the schema for an individual verification check result in the verify-quest tool
 *
 * USAGE:
 * const check: VerifyQuestCheck = verifyQuestCheckContract.parse({ name: 'Observable Coverage', passed: true, details: 'All covered' });
 * // Returns validated VerifyQuestCheck with name, passed status, and details
 */
import { z } from 'zod';

export const verifyQuestCheckContract = z.object({
  name: z.string().min(1).brand<'CheckName'>(),
  passed: z.boolean(),
  details: z.string().brand<'CheckDetails'>(),
});

export type VerifyQuestCheck = z.infer<typeof verifyQuestCheckContract>;
