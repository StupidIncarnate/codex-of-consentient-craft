/**
 * PURPOSE: Reads one instance's snapshot index off disk as the RAW, append-only write log — every
 * record, in capture order, duplicates included. An ABSENT index is a real, empty answer: a fresh
 * instance has captured nothing, and a killed one had its whole throwaway home removed, so there is
 * no file and nothing went wrong. A PRESENT-but-unparseable index throws
 * `SnapshotIndexUnreadableError` instead, for the same reason `registryReadBroker` refuses to collapse
 * "broken" into "empty": a caller told there is nothing to return to, while the payload directories
 * sit on disk beside the index, then measures against a state nobody intended. Reach for this over
 * `snapshotListBroker` whenever you need the WRITE LOG — the next payload directory is numbered off
 * its length, which the collapsed reader's output cannot give.
 *
 * USAGE:
 * await snapshotIndexReadBroker({
 *   homePath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' }),
 * });
 * // Returns every SnapshotRecord in capture order, or [] when no index exists yet
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { snapshotOrdinalContract } from '../../../contracts/snapshot-ordinal/snapshot-ordinal-contract';
import { snapshotRecordContract } from '../../../contracts/snapshot-record/snapshot-record-contract';
import type { SnapshotRecord } from '../../../contracts/snapshot-record/snapshot-record-contract';
import { SnapshotIndexUnreadableError } from '../../../errors/snapshot-index-unreadable/snapshot-index-unreadable-error';
import { snapshotStatics } from '../../../statics/snapshot/snapshot-statics';
import { locationsSnapshotPathsFindBroker } from '../../locations/snapshot-paths-find/locations-snapshot-paths-find-broker';

export const snapshotIndexReadBroker = async ({
  homePath,
}: {
  homePath: AbsoluteFilePath;
}): Promise<readonly SnapshotRecord[]> => {
  // The index path does not depend on the ordinal — the resolver takes one anyway so that its
  // `payload` is never a null every caller has to narrow, and this reader passes the first and
  // ignores what comes back for it.
  const { index } = locationsSnapshotPathsFindBroker({
    homePath,
    ordinal: snapshotOrdinalContract.parse(snapshotStatics.numbering.firstPayload),
  });

  // `fsStatAdapter` answers null for ENOENT rather than throwing, which is exactly the "no captures
  // yet, or the home is gone" case — and it distinguishes that from a read that fails for a real
  // reason, which propagates from the read below.
  const stat = await fsStatAdapter({ filePath: index });
  if (stat === null) {
    return [];
  }

  const contents = await fsReadFileAdapter({ filePath: index });
  const lines = contents.split('\n').filter((line) => line.trim().length > 0);

  try {
    return lines.map((line) => snapshotRecordContract.parse(JSON.parse(line)));
  } catch (error) {
    throw new SnapshotIndexUnreadableError({ indexPath: index, cause: error });
  }
};
