/**
 * PURPOSE: Defines the PathseekerRun structure for tracking PathSeeker retry attempts with session IDs
 *
 * USAGE:
 * pathseekerRunContract.parse({attempt: 1, startedAt: '2024-01-15T10:00:00.000Z', status: 'in_progress'});
 * // Returns: PathseekerRun object
 */

import { z } from 'zod';

import { pathseekerRunStatusContract } from '../pathseeker-run-status/pathseeker-run-status-contract';
import { sessionIdContract } from '../session-id/session-id-contract';

export const pathseekerRunContract = z.object({
  sessionId: sessionIdContract.optional(),
  attempt: z.number().int().nonnegative().brand<'PathseekerAttempt'>(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>(),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  status: pathseekerRunStatusContract,
});

export type PathseekerRun = z.infer<typeof pathseekerRunContract>;
