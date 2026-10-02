/**
 * PURPOSE: Defines the machine lease contract for coordinating concurrent resource usage across processes.
 *
 * USAGE:
 * leaseContract.parse({
 *   leaseId: 'lease-123',
 *   tool: 'ward',
 *   label: '@dungeonmaster/web',
 *   ownerPid: 12345,
 *   state: 'starting',
 *   expectedPeakMB: 512,
 *   currentRssMB: null,
 *   startedAtMs: 1700000000000,
 *   lastBeatMs: 1700000000000,
 * });
 * // Returns: Lease validated object
 */

import { z } from '#gateway/npm/zod';

export const leaseContract = z
  .object({
    leaseId: z.string().min(1).brand<'LeaseLeaseId'>(),
    tool: z.enum(['ward', 'siegelense']),
    label: z.string().brand<'LeaseLabel'>(),
    ownerPid: z.number().int().positive().brand<'LeaseOwnerPid'>(),
    state: z.enum(['starting', 'running']),
    expectedPeakMB: z.number().int().positive().brand<'LeaseExpectedPeakMB'>().nullable(),
    currentRssMB: z.number().int().nonnegative().brand<'LeaseCurrentRssMB'>().nullable(),
    startedAtMs: z.number().int().nonnegative().brand<'LeaseStartedAtMs'>(),
    lastBeatMs: z.number().int().nonnegative().brand<'LeaseLastBeatMs'>(),
  })
  .brand<'Lease'>();

export type Lease = z.infer<typeof leaseContract>;
export type LeaseTool = Lease['tool'];
export type LeaseState = Lease['state'];
