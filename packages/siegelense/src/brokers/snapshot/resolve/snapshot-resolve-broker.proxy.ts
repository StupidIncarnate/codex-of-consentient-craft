import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { snapshotIndexReadBrokerProxy } from '../index-read/snapshot-index-read-broker.proxy';
import type { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';

type SnapshotRecord = ReturnType<typeof SnapshotRecordStub>;

export const snapshotResolveBrokerProxy = (): {
  setupNoStore: (params: { homePath: AbsoluteFilePath }) => void;
  setupStoreHolding: (params: {
    homePath: AbsoluteFilePath;
    records: readonly SnapshotRecord[];
  }) => void;
} => {
  const indexReadProxy = snapshotIndexReadBrokerProxy();

  return {
    setupNoStore: ({ homePath }: { homePath: AbsoluteFilePath }): void => {
      indexReadProxy.setupNoIndex({ homePath });
    },

    setupStoreHolding: ({
      homePath,
      records,
    }: {
      homePath: AbsoluteFilePath;
      records: readonly SnapshotRecord[];
    }): void => {
      indexReadProxy.setupIndex({ homePath, records });
    },
  };
};
