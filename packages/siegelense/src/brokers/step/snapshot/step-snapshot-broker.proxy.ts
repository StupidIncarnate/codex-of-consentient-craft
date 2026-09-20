import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { snapshotCaptureBrokerProxy } from '../../snapshot/capture/snapshot-capture-broker.proxy';

export const stepSnapshotBrokerProxy = (): {
  setupEmptyStore: (params: { homePath: AbsoluteFilePath }) => void;
  appendedRecordsFor: (params: { homePath: AbsoluteFilePath }) => unknown[];
} => {
  const captureProxy = snapshotCaptureBrokerProxy();

  return {
    setupEmptyStore: ({ homePath }: { homePath: AbsoluteFilePath }): void => {
      captureProxy.setupEmptyStore({ homePath });
    },
    appendedRecordsFor: ({ homePath }: { homePath: AbsoluteFilePath }): unknown[] =>
      captureProxy.appendedRecordsFor({ homePath }),
  };
};
