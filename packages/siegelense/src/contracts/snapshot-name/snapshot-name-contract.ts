/**
 * PURPOSE: Names one point `reset level: 'state'` can return to — either a name a caller typed
 * (`clean`, `after-cycle-1`) or one the run minted for itself (`run_4:start`). The character class
 * admits the colon deliberately: it is what namespaces the automatic pair away from a typed name
 * (siegelense-tooling.md line 2630), so a contract rejecting it would make the automatic names
 * unrepresentable. Reach for this over `NodeLabel`: a node label marks a point on a PATH a walk
 * crosses, while this marks a point on DISK a reset can rewind to.
 *
 * USAGE:
 * snapshotNameContract.parse('run_4:start');
 * // Returns a branded SnapshotName
 */

import { z } from 'zod';

import { snapshotStatics } from '../../statics/snapshot/snapshot-statics';

export const snapshotNameContract = z
  .string()
  .min(1)
  .max(snapshotStatics.limits.maxNameLength)
  .regex(/^[A-Za-z0-9._:-]+$/u)
  .brand<'SnapshotName'>();

export type SnapshotName = z.infer<typeof snapshotNameContract>;
