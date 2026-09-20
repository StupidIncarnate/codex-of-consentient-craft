/**
 * PURPOSE: Turns a caller-supplied snapshot name into the record that says where its payload is, or
 * throws. This is the ONE rule `reset` inherits rather than re-deciding: siegelense-tooling.md line
 * 2478 — "A `reset` naming one that does not exist is an error, never a fall-back to the nearest."
 * There is deliberately no nearest-match, no prefix match and no single-candidate shortcut here, so a
 * mistyped name cannot silently rewind an instance to a point nobody chose — that is the
 * tainted-baseline failure (line 1091) arriving with a different cause, and it is invisible because
 * every measurement after it looks fine. Reach for this over `snapshotListBroker` whenever a name has
 * already been chosen; the lister answers "what is there", this answers "where is that one".
 *
 * USAGE:
 * await snapshotResolveBroker({
 *   homePath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' }),
 *   name: SnapshotNameStub({ value: 'clean' }),
 * });
 * // Returns the latest SnapshotRecord captured under that name
 *
 * await snapshotResolveBroker({ homePath, name: SnapshotNameStub({ value: 'clen' }) });
 * // Throws SnapshotMissingError naming "clen" and listing every snapshot that does exist
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { SnapshotName } from '../../../contracts/snapshot-name/snapshot-name-contract';
import type { SnapshotRecord } from '../../../contracts/snapshot-record/snapshot-record-contract';
import { SnapshotMissingError } from '../../../errors/snapshot-missing/snapshot-missing-error';
import { snapshotIndexCollapseTransformer } from '../../../transformers/snapshot-index-collapse/snapshot-index-collapse-transformer';
import { snapshotIndexReadBroker } from '../index-read/snapshot-index-read-broker';

export const snapshotResolveBroker = async ({
  homePath,
  name,
}: {
  homePath: AbsoluteFilePath;
  name: SnapshotName;
}): Promise<SnapshotRecord> => {
  const records = await snapshotIndexReadBroker({ homePath });

  // Collapsed, so re-capturing a name resolves to the CURRENT point rather than the first one ever
  // written — the same view `snapshotListBroker` shows, which is what keeps "what exists" and "where
  // is it" from disagreeing.
  const current = snapshotIndexCollapseTransformer({ records });
  const match = current.find((record) => record.name === name) ?? null;

  if (match === null) {
    throw new SnapshotMissingError({
      name,
      available: current.map((record) => record.name),
    });
  }

  return match;
};
