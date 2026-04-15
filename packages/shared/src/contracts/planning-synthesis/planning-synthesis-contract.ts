/**
 * PURPOSE: Defines the PlanningSynthesis structure — PathSeeker's post-minion synthesis across all surface reports
 *
 * USAGE:
 * planningSynthesisContract.parse({orderOfOperations: '...', crossSliceResolutions: '...', claudemdRulesInEffect: [], openAssumptions: [], synthesizedAt: '2024-...'});
 * // Returns: PlanningSynthesis object — PathSeeker's Phase 4 output
 */

import { z } from 'zod';

export const planningSynthesisContract = z.object({
  orderOfOperations: z.string().min(1).brand<'OrderOfOperations'>(),
  crossSliceResolutions: z.string().min(1).brand<'CrossSliceResolutions'>(),
  claudemdRulesInEffect: z.array(z.string().min(1).brand<'ClaudeMdRule'>()).default([]),
  openAssumptions: z.array(z.string().min(1).brand<'SynthesisAssumption'>()).default([]),
  synthesizedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type PlanningSynthesis = z.infer<typeof planningSynthesisContract>;
