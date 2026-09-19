/**
 * PURPOSE: Takes one snapshot — copies the instance's whole throwaway home into a numbered payload
 * directory, then appends the record that makes it findable. The copy covers the STATE subtree and
 * nothing else: the evidence directory holds the logs, captures and transcript and is never a source
 * here, so "evidence accumulates forward; only state rewinds" (siegelense-tooling.md line 1061) is a
 * property of what this broker reads rather than a rule someone has to remember. The snapshot store
 * itself sits inside the home it copies — that is what makes snapshots die with the instance on
 * `kill` — so it is excluded from its own copy.
 *
 * **The record is appended only AFTER the payload lands.** A capture whose copy fails leaves no index
 * line at all, so `snapshots` can never advertise a restore point that is not on disk — the
 * tainted-baseline failure (line 1091) arriving by a different route.
 *
 * A MANUAL name carrying one of the automatic suffixes is refused rather than accepted: line 2630
 * calls the automatic pair "namespaced so an explicit name can never collide", and the only way that
 * is true rather than hopeful is if the namespace is closed to callers at the point of capture.
 *
 * USAGE:
 * await snapshotCaptureBroker({
 *   homePath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' }),
 *   name: SnapshotNameStub({ value: 'clean' }),
 *   manual: true,
 * });
 * // Copies the home, appends one index line, and returns the SnapshotRecord it wrote
 */

import { fsMkdirAdapter } from '@dungeonmaster/shared/adapters';
import { fileContentsContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsAppendFileAdapter } from '../../../adapters/fs/append-file/fs-append-file-adapter';
import { fsCpAdapter } from '../../../adapters/fs/cp/fs-cp-adapter';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { SnapshotName } from '../../../contracts/snapshot-name/snapshot-name-contract';
import { snapshotOrdinalContract } from '../../../contracts/snapshot-ordinal/snapshot-ordinal-contract';
import { snapshotRecordContract } from '../../../contracts/snapshot-record/snapshot-record-contract';
import type { SnapshotRecord } from '../../../contracts/snapshot-record/snapshot-record-contract';
import { snapshotStatics } from '../../../statics/snapshot/snapshot-statics';
import { locationsSnapshotPathsFindBroker } from '../../locations/snapshot-paths-find/locations-snapshot-paths-find-broker';
import { snapshotIndexReadBroker } from '../index-read/snapshot-index-read-broker';

export const snapshotCaptureBroker = async ({
  homePath,
  name,
  manual,
}: {
  homePath: AbsoluteFilePath;
  name: SnapshotName;
  manual: boolean;
}): Promise<SnapshotRecord> => {
  const reservedSuffixes = [
    snapshotStatics.automatic.startSuffix,
    snapshotStatics.automatic.endSuffix,
  ];
  if (manual && reservedSuffixes.some((suffix) => name.endsWith(suffix))) {
    throw new Error(
      `Snapshot name "${String(name)}" ends in a suffix reserved for the automatic pair ` +
        `(${reservedSuffixes.join(', ')}) — every run mints its own "<runId>:start" and ` +
        `"<runId>:end", and a typed name taking one of those would overwrite a restore point the ` +
        `run is relying on. Pick a name that does not end in one.`,
    );
  }

  // The RAW write log, not the collapsed reader's view: the next payload directory is numbered off
  // how many captures have happened, and collapsing duplicate names away would reuse a number.
  const existing = await snapshotIndexReadBroker({ homePath });
  const ordinal = snapshotOrdinalContract.parse(
    existing.length + snapshotStatics.numbering.firstPayload,
  );

  const { storeDir, index, payload } = locationsSnapshotPathsFindBroker({ homePath, ordinal });

  // The store first, so the index append below has a directory to land in; then the payload, so the
  // record points at a real directory even when the home holds nothing worth copying.
  await fsMkdirAdapter({ filepath: filePathContract.parse(storeDir) });
  await fsMkdirAdapter({ filepath: filePathContract.parse(payload) });

  // `excludeName` is the store's own directory name: the payload sits INSIDE the home being copied,
  // so without it the copy would contain the previous captures and grow with every snapshot.
  await fsCpAdapter({
    sourcePath: homePath,
    destinationPath: payload,
    excludeName: snapshotStatics.store.dirName,
  });

  const record = snapshotRecordContract.parse({
    name,
    atMs: epochMsContract.parse(Date.now()),
    manual,
    path: payload,
  });

  await fsAppendFileAdapter({
    filePath: index,
    contents: fileContentsContract.parse(`${JSON.stringify(record)}\n`),
  });

  return record;
};
