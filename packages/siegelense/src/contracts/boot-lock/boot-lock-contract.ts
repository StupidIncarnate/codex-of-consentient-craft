/**
 * PURPOSE: The lock held for the duration of one boot, released by completion or by heartbeat
 * staleness (spec line 135). It enforces one boot at a time ACROSS processes — "the tool staggers"
 * is a promise no process can keep about another one it cannot see (spec line 1620) — because a
 * spec's PEAK memory sample is taken DURING boot, and two instances booting together pollute each
 * other's sample (spec line 1755).
 *
 * USAGE:
 * const lock = bootLockContract.parse({
 *   heldBy: 'inst_7f3a9c21',
 *   heldByPid: 'proc-12345',
 *   acquiredAtMs: 1700000000000,
 * });
 * // Returns a validated BootLock
 */

import { z } from '#gateway/npm/zod';

import { siegeInstanceContract } from '@dungeonmaster/shared/contracts';


export const bootLockContract = z.object({
  heldBy: siegeInstanceContract.shape.id,
  heldByPid: z.string().min(1).brand<'BootLockHeldByPid'>(),
  acquiredAtMs: z.number().int().nonnegative().brand<'BootLockAcquiredAtMs'>(),
});

export type BootLock = z.infer<typeof bootLockContract>;
