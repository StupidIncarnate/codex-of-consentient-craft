import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';
import type { DrivingOddityStub } from '../../../contracts/driving-oddity/driving-oddity.stub';
import { drivingOddityReadBrokerProxy } from '../read/driving-oddity-read-broker.proxy';

type DrivingOddity = ReturnType<typeof DrivingOddityStub>;

export const drivingOddityAppendBrokerProxy = (): {
  setupEmptyFile: (params: { filePath: AbsoluteFilePath }) => void;
  setupExistingEntries: (params: {
    filePath: AbsoluteFilePath;
    entries: readonly DrivingOddity[];
  }) => void;
  appendedLinesFor: (params: { filePath: AbsoluteFilePath }) => readonly unknown[];
} => {
  const readProxy = drivingOddityReadBrokerProxy();
  const appendProxy = fsAppendFileAdapterProxy();

  return {
    setupEmptyFile: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      readProxy.setupNoFile({ filePath });
      appendProxy.succeeds({ filePath });
    },

    setupExistingEntries: ({
      filePath,
      entries,
    }: {
      filePath: AbsoluteFilePath;
      entries: readonly DrivingOddity[];
    }): void => {
      readProxy.setupFile({ filePath, entries });
      appendProxy.succeeds({ filePath });
    },

    // Every line appended for this path, in call order — the proof a duplicate refusal never
    // reaches the adapter is that this list stays empty after a rejected call.
    appendedLinesFor: ({ filePath }: { filePath: AbsoluteFilePath }): readonly unknown[] =>
      appendProxy.getAppendedFor({ filePath }),
  };
};
