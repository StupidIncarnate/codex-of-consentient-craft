/**
 * PURPOSE: Defines valid phases for quest orchestration execution
 *
 * USAGE:
 * orchestrationPhaseContract.parse('pathseeker');
 * // Returns: OrchestrationPhase branded enum value
 */

import { z } from 'zod';

export const orchestrationPhaseContract = z.enum([
  'pathseeker',
  'codeweaver',
  'siegemaster',
  'lawbringer',
  'spiritmender',
  'ward',
  'idle',
  'complete',
  'failed',
]);

export type OrchestrationPhase = z.infer<typeof orchestrationPhaseContract>;
