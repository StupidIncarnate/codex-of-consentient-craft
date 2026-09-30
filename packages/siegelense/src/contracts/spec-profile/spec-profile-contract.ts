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

import { z } from '#gateway/npm/zod';


import { specHashContract } from '../spec-hash/spec-hash-contract';

export const specProfileContract = z.object({
  specName: z.string().min(1).brand<'SpecProfileSpecName'>(),
  processes: z.number().int().nonnegative().brand<'SpecProfileProcesses'>(),
  hash: specHashContract,
  measuredAt: z.string().brand<'SpecProfileMeasuredAt'>().nullable(),
  fromRuns: z.number().int().nonnegative().brand<'SpecProfileFromRuns'>(),
  bootMs: z.number().int().nonnegative().brand<'SpecProfileBootMs'>().nullable(),
  samples: z
    .array(
      z.object({
        poolSize: z.number().int().positive().brand<'SpecProfileSamplesPoolSize'>(),
        steadyMB: z.number().int().nonnegative().brand<'SpecProfileSamplesSteadyMB'>(),
        peakMB: z.number().int().nonnegative().brand<'SpecProfileSamplesPeakMB'>(),
        runs: z.number().int().nonnegative().brand<'SpecProfileSamplesRuns'>(),
      }),
    )
    .readonly(),
});

export type SpecProfile = z.infer<typeof specProfileContract>;
