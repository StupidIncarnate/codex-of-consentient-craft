/**
 * PURPOSE: The `profile` block of a `capacity` answer — the ONE measured sample group the division
 * was made against (siegelense-tooling.md line 1575). Reach for this over `SpecProfile`: that
 * carries every group a spec has ever been measured at, and `capacity` must read exactly one of
 * them (line 2526 — a solo sample and a contended one describe different worlds, and averaging them
 * produces a number true of neither).
 *
 * `poolSize` is what makes that rule checkable from the answer alone: the spec's own example omits
 * it, and without it a reader cannot tell a group that was selected from two that were blended.
 *
 * USAGE:
 * capacityProfileContract.parse({
 *   spec: 'dungeonmaster-web', poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9,
 * });
 * // Returns a validated CapacityProfile
 */

import { z } from 'zod';

import { megabytesContract } from '../megabytes/megabytes-contract';
import { profilePoolSizeContract } from '../profile-pool-size/profile-pool-size-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';
import { specNameContract } from '../spec-name/spec-name-contract';

export const capacityProfileContract = z
  .object({
    spec: specNameContract,
    poolSize: profilePoolSizeContract,
    steadyMB: megabytesContract,
    peakMB: megabytesContract,
    fromRuns: readingCountContract,
  })
  .strict();

export type CapacityProfile = z.infer<typeof capacityProfileContract>;
