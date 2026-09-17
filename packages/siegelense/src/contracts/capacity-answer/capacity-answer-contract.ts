/**
 * PURPOSE: The whole `capacity {}` answer — `suggested`, `ceiling`, a `why` sentence, and the
 * `measured` and `profile` blocks the judgement was made from (siegelense-tooling.md lines
 * 2506-2509). Reach for this over reading a machine block and a profile separately at a call site:
 * `suggested` is an inversion of the STAGGERED high-water mark (line 1524), and a caller that
 * divides free memory by peak itself gets the under-provisioning the spec calls the expensive
 * mistake.
 *
 * `profile` is `.nullable()` because a spec nothing has ever run is a real answer, not a failure:
 * `suggested` then falls back to the default pair that profiles itself (line 1517), and a fabricated
 * set of memory figures here would be exactly the typed number line 2512 forbids. `.strict()` so a
 * later field is a parse error rather than a silently accepted extra key.
 *
 * USAGE:
 * capacityAnswerContract.parse({
 *   suggested: 2,
 *   ceiling: 3,
 *   why: 'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; …',
 *   measured: { freeMemMB: 5320, cores: 8, loadAvg1: 4.2, siegeInstances: 1, diskFreeMB: 41000 },
 *   profile: { spec: 'dungeonmaster-web', poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 },
 * });
 * // Returns a validated CapacityAnswer
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { capacityMeasuredContract } from '../capacity-measured/capacity-measured-contract';
import { capacityProfileContract } from '../capacity-profile/capacity-profile-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';

export const capacityAnswerContract = z
  .object({
    suggested: readingCountContract,
    ceiling: readingCountContract,
    why: contentTextContract,
    measured: capacityMeasuredContract,
    profile: capacityProfileContract.nullable(),
  })
  .strict();

export type CapacityAnswer = z.infer<typeof capacityAnswerContract>;
