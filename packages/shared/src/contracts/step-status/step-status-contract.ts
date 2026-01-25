/**
 * PURPOSE: Defines valid step status values for quest steps
 *
 * USAGE:
 * stepStatusContract.parse('pending');
 * // Returns: 'pending' as StepStatus
 */

import { z } from 'zod';

export const stepStatusContract = z.enum([
  'pending',
  'in_progress',
  'complete',
  'failed',
  'blocked',
  'partially_complete',
]);

export type StepStatus = z.infer<typeof stepStatusContract>;
