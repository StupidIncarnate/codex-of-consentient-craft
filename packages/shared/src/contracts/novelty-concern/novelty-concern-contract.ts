/**
 * PURPOSE: Defines a NoveltyConcern entry — a verify-minion's flag of novel tech, testing, or pattern usage
 *
 * USAGE:
 * noveltyConcernContract.parse({area: 'tech', description: '...', recommendsExploratory: true});
 * // Returns: NoveltyConcern object describing a novel surface that may warrant an exploratory step
 */

import { z } from 'zod';

export const noveltyConcernContract = z.object({
  area: z
    .enum(['tech', 'testing', 'pattern'])
    .describe(
      'Category of novelty: "tech" (new dependency or API), "testing" (new testing pattern), "pattern" (new architectural pattern)',
    ),
  description: z
    .string()
    .min(1)
    .brand<'NoveltyDescription'>()
    .describe('Human-readable description of the novel surface and why it warrants concern'),
  recommendsExploratory: z
    .boolean()
    .describe(
      'Whether the verify-minion recommends pathseeker add an exploratory step before the dependent work',
    ),
});

export type NoveltyConcern = z.infer<typeof noveltyConcernContract>;
