/**
 * PURPOSE: Defines the PlanningScopeClassification structure for PathSeeker's scope-classification phase
 *
 * USAGE:
 * planningScopeClassificationContract.parse({size: 'medium', slicing: '...', rationale: '...', classifiedAt: '2024-...'});
 * // Returns: PlanningScopeClassification object — PathSeeker's Phase 1+2 output
 */

import { z } from 'zod';

export const planningScopeClassificationContract = z.object({
  size: z.enum(['small', 'medium', 'large']),
  slicing: z.string().min(1).brand<'SlicingDescription'>(),
  rationale: z.string().min(1).brand<'ScopeRationale'>(),
  classifiedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type PlanningScopeClassification = z.infer<typeof planningScopeClassificationContract>;
