/**
 * PURPOSE: Builds the name of one half of a run's automatic snapshot pair — `run_4` plus a boundary
 * becomes `run_4:start` (siegelense-tooling.md line 2633). The colon is what namespaces these away
 * from anything a caller types, which is the property line 2630 calls out ("namespaced so an explicit
 * name can never collide"), so the suffixes live in `snapshotStatics.automatic` and this is the one
 * place they are joined onto a run id. Reach for this over writing the string at the call site: two
 * call sites spelling the pair independently is how `run_4:end` and `run_4:END` end up in one index.
 *
 * USAGE:
 * snapshotAutoNameTransformer({
 *   runId: RunIdStub({ value: 'run_4' }),
 *   boundary: SnapshotBoundaryStub({ value: 'start' }),
 * });
 * // Returns 'run_4:start' as a branded SnapshotName
 */

import type { RunId } from '../../contracts/run-id/run-id-contract';
import type { SnapshotBoundary } from '../../contracts/snapshot-boundary/snapshot-boundary-contract';
import { snapshotNameContract } from '../../contracts/snapshot-name/snapshot-name-contract';
import type { SnapshotName } from '../../contracts/snapshot-name/snapshot-name-contract';
import { snapshotStatics } from '../../statics/snapshot/snapshot-statics';

export const snapshotAutoNameTransformer = ({
  runId,
  boundary,
}: {
  runId: RunId;
  boundary: SnapshotBoundary;
}): SnapshotName => {
  const suffix =
    boundary === 'start'
      ? snapshotStatics.automatic.startSuffix
      : snapshotStatics.automatic.endSuffix;

  return snapshotNameContract.parse(`${String(runId)}${suffix}`);
};
