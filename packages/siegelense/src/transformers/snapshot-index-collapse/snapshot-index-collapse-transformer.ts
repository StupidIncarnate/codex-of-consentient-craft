/**
 * PURPOSE: Turns the raw, append-only snapshot index into the list of restore points that CURRENTLY
 * exist — latest capture wins per name, ordered oldest-first by capture time. A name is a restore
 * POINT, and re-capturing `clean` moves that point rather than creating a second one, so both the
 * lister and the resolver have to agree on which `clean` is current. They agree by both calling this:
 * the rule lives in one place instead of being decided twice. Reach for this over reading
 * `snapshotIndexReadBroker`'s output directly — that output is the raw write log, which is what a
 * capture needs (to number the next payload directory) and not what a reader needs.
 *
 * USAGE:
 * snapshotIndexCollapseTransformer({ records });
 * // Returns the latest record per name, ordered by atMs ascending
 */

import { snapshotRecordContract } from '../../contracts/snapshot-record/snapshot-record-contract';
import type { SnapshotRecord } from '../../contracts/snapshot-record/snapshot-record-contract';
import type { SnapshotName } from '../../contracts/snapshot-name/snapshot-name-contract';

export const snapshotIndexCollapseTransformer = ({
  records,
}: {
  records: readonly SnapshotRecord[];
}): readonly SnapshotRecord[] => {
  // A Map keyed on the name, written in index order, so the LAST write for a name is what survives —
  // the index is append-only, so later in the file is later in time.
  const latestByName = new Map<SnapshotName, SnapshotRecord>();
  records.forEach((record) => {
    latestByName.set(record.name, record);
  });

  return [...latestByName.values()]
    .sort((left, right) => left.atMs - right.atMs)
    .map((record) => snapshotRecordContract.parse(record));
};
