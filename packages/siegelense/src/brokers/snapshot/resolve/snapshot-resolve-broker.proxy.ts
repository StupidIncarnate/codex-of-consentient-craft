
import { snapshotIndexReadBrokerProxy } from '../index-read/snapshot-index-read-broker.proxy';
import type { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';

type SnapshotRecord = ReturnType<typeof SnapshotRecordStub>;

export const snapshotResolveBrokerProxy = (): {
  setupNoStore: (params: { homePath: string }) => void;
  setupStoreHolding: (params: {
    homePath: string;
    records: readonly SnapshotRecord[];
  }) => void;
} => {
  const indexReadProxy = snapshotIndexReadBrokerProxy();

  return {
    setupNoStore: ({ homePath }: { homePath: string }): void => {
      indexReadProxy.setupNoIndex({ homePath });
    },

    setupStoreHolding: ({
      homePath,
      records,
    }: {
      homePath: string;
      records: readonly SnapshotRecord[];
    }): void => {
      indexReadProxy.setupIndex({ homePath, records });
    },
  };
};
