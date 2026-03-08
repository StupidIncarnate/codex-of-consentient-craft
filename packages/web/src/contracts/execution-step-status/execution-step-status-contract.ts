/**
 * PURPOSE: Defines valid execution step status values including queued state
 *
 * USAGE:
 * executionStepStatusContract.parse('in_progress');
 * // Returns: ExecutionStepStatus branded enum value
 */

import { z } from 'zod';

export const executionStepStatusContract = z.enum([
  'queued',
  'pending',
  'in_progress',
  'complete',
  'failed',
  'partially_complete',
  'blocked',
]);

export type ExecutionStepStatus = z.infer<typeof executionStepStatusContract>;
