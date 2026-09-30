import { snapshotCaptureBrokerProxy } from '../../snapshot/capture/snapshot-capture-broker.proxy';

export const stepSnapshotBrokerProxy = (): {
  setupEmptyStore: (params: { homePath: string }) => void;
  appendedRecordsFor: (params: { homePath: string }) => unknown[];
} => {
  const captureProxy = snapshotCaptureBrokerProxy();

  return {
    setupEmptyStore: ({ homePath }: { homePath: string }): void => {
      captureProxy.setupEmptyStore({ homePath });
    },
    appendedRecordsFor: ({ homePath }: { homePath: string }): unknown[] =>
      captureProxy.appendedRecordsFor({ homePath }),
  };
};
