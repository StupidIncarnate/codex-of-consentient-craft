/**
 * PURPOSE: What `snapshots` hands back — the list of points `reset level: 'state'` can return to for
 * one instance (siegelense-tooling.md line 2469). `instanceState` rides along for the same reason it
 * rides on every `results` answer (line 2239) and it is load-bearing here rather than decorative: an
 * empty list means "this instance has captured nothing yet" against `alive`, and "the throwaway home
 * is gone and took its restore points with it" against `killed`. Without the field those two answers
 * are the same empty array. Reach for this over `ResultsAnswer`: results reads EVIDENCE, which
 * outlives the instance; this reads STATE, which does not.
 *
 * USAGE:
 * snapshotsAnswerContract.parse({
 *   instanceId: 'inst_7f3a9c21', instanceState: 'alive',
 *   snapshots: [{ name: 'clean', atMs: 1735689600000, manual: true, path: '/tmp/…/1' }],
 * });
 * // Returns a validated SnapshotsAnswer
 */

import { z } from 'zod';

import { instanceIdContract } from '../instance-id/instance-id-contract';
import { instanceStateContract } from '../instance-state/instance-state-contract';
import { snapshotRecordContract } from '../snapshot-record/snapshot-record-contract';

export const snapshotsAnswerContract = z
  .object({
    instanceId: instanceIdContract,
    instanceState: instanceStateContract,
    snapshots: z.array(snapshotRecordContract).readonly(),
  })
  .strict();

export type SnapshotsAnswer = z.infer<typeof snapshotsAnswerContract>;
