/**
 * PURPOSE: Defines the structure of a single verification check result with name, pass/fail, and optional message
 *
 * USAGE:
 * questVerifyCheckContract.parse({name: 'dependency-graph', passed: true});
 * // Returns validated QuestVerifyCheck object
 */

import { z } from 'zod';

export const questVerifyCheckContract = z.object({
  name: z.string().min(1).brand<'CheckName'>(),
  passed: z.boolean(),
  message: z.string().brand<'CheckMessage'>().optional(),
});

export type QuestVerifyCheck = z.infer<typeof questVerifyCheckContract>;
