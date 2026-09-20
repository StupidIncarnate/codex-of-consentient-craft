/**
 * PURPOSE: What `run` returns — a STATUS, never a payload (siegelense-tooling.md line 49: "run →
 * submit a BATCH of steps; blocks; returns a STATUS, never a payload"). Reach for this over
 * StepReading or ShotListing individually: those are queried narrowly through `results` afterwards,
 * while a RunResult is everything a session needs to DECIDE whether to query at all — an index that
 * says what is worth reading, a shot list that already flags which to open, and, on a failure,
 * exactly where the first one landed. `stoppedAt` is `null` for a `done` run and populated for
 * `timeout` or `failed`, and it names the FIRST failure's location. Under `stopOn: 'error'` that
 * location is also where the batch halted, but under `stopOn: 'never'` the batch runs every
 * remaining step regardless — so `stoppedAt` names where the run WOULD have stopped, not where it
 * did. `index` and `shots` are always present, even empty, because "nothing happened" and "nobody
 * looked" are different answers this shape must be able to tell apart.
 *
 * USAGE:
 * runResultContract.parse({
 *   instanceId: 'inst_7f3a9c21', runId: 'run_2', status: 'done', stepsRun: 5, stoppedAt: null,
 *   index: { console: { errors: 0, warnings: 2 }, server: { errors: 0 },
 *            network: { exchanges: 14, non2xx: 0 } },
 *   shots: [],
 * });
 * // Returns a validated RunResult
 */

import { z } from 'zod';

import { instanceIdContract } from '../instance-id/instance-id-contract';
import { runIdContract } from '../run-id/run-id-contract';
import { runIndexContract } from '../run-index/run-index-contract';
import { runStatusContract } from '../run-status/run-status-contract';
import { shotListingContract } from '../shot-listing/shot-listing-contract';
import { stepIndexContract } from '../step-index/step-index-contract';
import { stoppedAtContract } from '../stopped-at/stopped-at-contract';

export const runResultContract = z.object({
  instanceId: instanceIdContract,
  runId: runIdContract,
  status: runStatusContract,
  stepsRun: stepIndexContract,
  stoppedAt: stoppedAtContract.nullable(),
  index: runIndexContract,
  shots: z.array(shotListingContract).readonly(),
  durationMs: z.number().int().nonnegative().brand<'DurationMs'>().optional(),
});

export type RunResult = z.infer<typeof runResultContract>;
