/**
 * PURPOSE: One line of an instance's snapshot index — a point `reset level: 'state'` can return to,
 * with the payload directory holding the copied state. `manual` is the field that tells a point a
 * caller MARKED (it knew that moment would matter) from one the run minted at a boundary it could not
 * have foreseen — siegelense-tooling.md line 2636 turns on exactly that distinction. `path` is not in
 * the spec's worked example and is carried anyway: without it `reset` would have to re-derive the
 * payload directory from an ordinal the record does not hold, and the two could then disagree about
 * which copy a name points at. Reach for this over `ShotListing`: a shot is evidence that outlives the
 * instance, while a snapshot record dies with the throwaway home it lives inside.
 *
 * USAGE:
 * snapshotRecordContract.parse({
 *   name: 'run_4:start', atMs: 1735689600000, manual: false,
 *   path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
 * });
 * // Returns a validated SnapshotRecord
 */

import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { snapshotNameContract } from '../snapshot-name/snapshot-name-contract';

export const snapshotRecordContract = z
  .object({
    name: snapshotNameContract,
    atMs: epochMsContract,
    manual: z.boolean(),
    path: absoluteFilePathContract,
  })
  .strict();

export type SnapshotRecord = z.infer<typeof snapshotRecordContract>;
