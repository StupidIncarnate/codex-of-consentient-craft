/**
 * PURPOSE: Resolves where one instance's snapshot store lives — the store directory, its index file,
 * and the payload directory one capture copies into. Everything sits under the THROWAWAY HOME rather
 * than under the evidence tree, and that placement is the whole design: `laneTeardownBroker` removes
 * exactly `session.homePath` on `kill`, so a store inside it dies with the instance ("snapshots are
 * gone with the instance"), while the evidence directory it never touches keeps the logs, captures
 * and transcript that outlive the walk (siegelense-tooling.md lines 1055-1061). Takes `homePath` as a
 * parameter rather than resolving it from an instance id, the same way `locationsRunPathsFindBroker`
 * takes `evidencePath`: the caller has already resolved it once, and re-deriving it here would risk
 * disagreeing with what the lane actually booted against.
 *
 * `ordinal` is required rather than nullable even though `storeDir` and `index` do not depend on it,
 * so that `payload` is never a null every caller has to narrow. A reader that wants only the index
 * passes `snapshotStatics.numbering.firstPayload` and ignores the payload it gets back.
 *
 * USAGE:
 * locationsSnapshotPathsFindBroker({
 *   homePath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1' }),
 *   ordinal: SnapshotOrdinalStub({ value: 2 }),
 * });
 * // Returns {
 * //   storeDir: '/tmp/dm-siege-inst_1/.siegelense-snapshots',
 * //   index:    '/tmp/dm-siege-inst_1/.siegelense-snapshots/index.jsonl',
 * //   payload:  '/tmp/dm-siege-inst_1/.siegelense-snapshots/2',
 * // }
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { SnapshotOrdinal } from '../../../contracts/snapshot-ordinal/snapshot-ordinal-contract';
import { snapshotStatics } from '../../../statics/snapshot/snapshot-statics';

export const locationsSnapshotPathsFindBroker = ({
  homePath,
  ordinal,
}: {
  homePath: AbsoluteFilePath;
  ordinal: SnapshotOrdinal;
}): {
  storeDir: AbsoluteFilePath;
  index: AbsoluteFilePath;
  payload: AbsoluteFilePath;
} => {
  const storeDir = pathJoinAdapter({
    paths: [homePath, snapshotStatics.store.dirName],
  });

  const index = pathJoinAdapter({
    paths: [storeDir, snapshotStatics.store.indexFileName],
  });

  // A payload directory is addressed by ORDINAL, never by the snapshot's own name: a name carries a
  // colon and a caller may capture the same one twice, so two records would otherwise collide on one
  // directory and the earlier restore point would be silently overwritten.
  const payload = pathJoinAdapter({ paths: [storeDir, String(ordinal)] });

  return {
    storeDir: absoluteFilePathContract.parse(storeDir),
    index: absoluteFilePathContract.parse(index),
    payload: absoluteFilePathContract.parse(payload),
  };
};
