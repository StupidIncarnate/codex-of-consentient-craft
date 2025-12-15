/**
 * PURPOSE: Defines valid phase status values for quest phases
 *
 * USAGE:
 * phaseStatusContract.parse('pending');
 * // Returns: 'pending' as PhaseStatus
 */

import { z } from 'zod';

export const phaseStatusContract = z.enum([
  'pending',
  'in_progress',
  'complete',
  'blocked',
  'skipped',
]);

export type PhaseStatus = z.infer<typeof phaseStatusContract>;
