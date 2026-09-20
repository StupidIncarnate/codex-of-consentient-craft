/**
 * PURPOSE: The whole `profile` answer — what one instance of a spec costs, folded across every
 * instance ever measured for it (siegelense-tooling.md lines 2517-2528). Reach for this over
 * `ProfileObservation`: an observation is one instance's raw record on disk, this is the reading
 * `capacity` divides free memory by.
 *
 * `hash` is the spec's CONTENT hash, so a spec that grows a second server is keyed somewhere else
 * and re-measures rather than answering with numbers taken against different processes (line 1471).
 * `samples` is an ARRAY grouped by pool size and never a single pair of numbers: a solo reading and a
 * contended one describe different worlds, and `capacity` reads the group matching the pool it is
 * about to open (line 2526). `measuredAt` and `bootMs` are nullable because a spec nothing has ever
 * run is a real, honest answer — the "with no profile, suggested is TWO" default belongs to
 * `capacity` (line 1517), never to a fabricated figure here.
 *
 * USAGE:
 * specProfileContract.parse({
 *   processes: 3,
 *   hash: 'a3f9c2e1',
 *   measuredAt: '2026-09-14',
 *   fromRuns: 14,
 *   bootMs: 20000,
 *   samples: [
 *     { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
 *     { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
 *   ],
 * });
 * // Returns a validated SpecProfile
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { megabytesContract } from '../megabytes/megabytes-contract';
import { profilePoolSizeContract } from '../profile-pool-size/profile-pool-size-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';
import { specHashContract } from '../spec-hash/spec-hash-contract';
import { specNameContract } from '../spec-name/spec-name-contract';

export const specProfileContract = z.object({
  specName: specNameContract,
  processes: readingCountContract,
  hash: specHashContract,
  measuredAt: contentTextContract.nullable(),
  fromRuns: readingCountContract,
  bootMs: epochMsContract.nullable(),
  samples: z
    .array(
      z.object({
        poolSize: profilePoolSizeContract,
        steadyMB: megabytesContract,
        peakMB: megabytesContract,
        runs: readingCountContract,
      }),
    )
    .readonly(),
});

export type SpecProfile = z.infer<typeof specProfileContract>;
