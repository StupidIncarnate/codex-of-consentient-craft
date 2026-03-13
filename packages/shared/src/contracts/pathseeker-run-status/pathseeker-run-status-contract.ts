/**
 * PURPOSE: Defines valid status values for PathSeeker run attempts
 *
 * USAGE:
 * pathseekerRunStatusContract.parse('in_progress');
 * // Returns: 'in_progress' as PathseekerRunStatus
 */

import { z } from 'zod';

export const pathseekerRunStatusContract = z.enum([
  'in_progress',
  'complete',
  'failed',
  'verification_failed',
]);

export type PathseekerRunStatus = z.infer<typeof pathseekerRunStatusContract>;
