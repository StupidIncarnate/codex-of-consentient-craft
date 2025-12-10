/**
 * PURPOSE: Defines valid task status values
 *
 * USAGE:
 * taskStatusContract.parse('pending');
 * // Returns: 'pending' as TaskStatus
 */

import { z } from 'zod';

export const taskStatusContract = z.enum([
  'pending',
  'in_progress',
  'complete',
  'failed',
  'skipped',
]);

export type TaskStatus = z.infer<typeof taskStatusContract>;
