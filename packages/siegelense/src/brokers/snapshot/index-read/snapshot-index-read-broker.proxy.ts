import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import { locationsSnapshotPathsFindBrokerProxy } from '../../locations/snapshot-paths-find/locations-snapshot-paths-find-broker.proxy';
import { snapshotStatics } from '../../../statics/snapshot/snapshot-statics';
import type { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';

type SnapshotRecord = ReturnType<typeof SnapshotRecordStub>;

const INDEX_SIZE_BYTES = 128;
const INDEX_MODIFIED_AT_MS = 1735689600000;
// The index's path relative to a home, spelled from the resolver's own known parts. Every path below
// is hand-concatenated rather than computed by CALLING the real resolver at test-setup time:
// `pathJoinAdapter`'s mock is shared across every resolver in this package and several of them stage
// ONE-SHOT returns, so a real join made during setup would consume a one-shot queued for a different
// resolver's later call. Same convention, and the same reason, as results-read-broker.proxy.ts's
// ROOT_PATH_VALUE.
const INDEX_SUFFIX = `${snapshotStatics.store.dirName}/${snapshotStatics.store.indexFileName}`;

export const snapshotIndexReadBrokerProxy = (): {
  indexPathFor: (params: { homePath: AbsoluteFilePath }) => AbsoluteFilePath;
  setupNoIndex: (params: { homePath: AbsoluteFilePath }) => void;
  setupIndex: (params: { homePath: AbsoluteFilePath; records: readonly SnapshotRecord[] }) => void;
  setupRawIndex: (params: { homePath: AbsoluteFilePath; contents: string }) => void;
} => {
  // Runs REAL — it is pure — so its own proxy is constructed for enforce-proxy-child-creation only.
  locationsSnapshotPathsFindBrokerProxy();

  const statProxy = statIfExistsProxy();
  const readProxy = readFileProxy();

  return {
    indexPathFor: ({ homePath }: { homePath: AbsoluteFilePath }): AbsoluteFilePath =>
      AbsoluteFilePathStub({ value: `${String(homePath)}/${INDEX_SUFFIX}` }),

    setupNoIndex: ({ homePath }: { homePath: AbsoluteFilePath }): void => {
      statProxy.missing({ path: `${String(homePath)}/${INDEX_SUFFIX}` });
    },

    setupIndex: ({
      homePath,
      records,
    }: {
      homePath: AbsoluteFilePath;
      records: readonly SnapshotRecord[];
    }): void => {
      const index = AbsoluteFilePathStub({ value: `${String(homePath)}/${INDEX_SUFFIX}` });
      statProxy.returnsFile({
        path: index,
        sizeBytes: INDEX_SIZE_BYTES,
        modifiedAtMs: INDEX_MODIFIED_AT_MS,
      });
      readProxy.returns({
        path: index,
        contents: `${records.map((record) => JSON.stringify(record)).join('\n')}\n`,
      });
    },

    // The same staging as setupIndex, but with the file body written by hand — for the malformed-line
    // case, which no array of valid records can express.
    setupRawIndex: ({
      homePath,
      contents,
    }: {
      homePath: AbsoluteFilePath;
      contents: string;
    }): void => {
      const index = AbsoluteFilePathStub({ value: `${String(homePath)}/${INDEX_SUFFIX}` });
      statProxy.returnsFile({
        path: index,
        sizeBytes: INDEX_SIZE_BYTES,
        modifiedAtMs: INDEX_MODIFIED_AT_MS,
      });
      readProxy.returns({ path: index, contents });
    },
  };
};
