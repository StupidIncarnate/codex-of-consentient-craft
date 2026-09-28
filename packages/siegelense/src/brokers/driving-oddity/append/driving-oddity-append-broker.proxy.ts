import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

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
  const appendProxy = appendFileProxy();

  return {
    setupEmptyFile: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      readProxy.setupNoFile({ filePath });
      appendProxy.succeeds({ path: filePath });
    },

    setupExistingEntries: ({
      filePath,
      entries,
    }: {
      filePath: AbsoluteFilePath;
      entries: readonly DrivingOddity[];
    }): void => {
      readProxy.setupFile({ filePath, entries });
      appendProxy.succeeds({ path: filePath });
    },

    // Every line appended for this path, in call order — the proof a duplicate refusal never
    // reaches `appendFile` is that this list stays empty after a rejected call.
    appendedLinesFor: ({ filePath }: { filePath: AbsoluteFilePath }): readonly unknown[] =>
      appendProxy.getCallsFor({ path: filePath }).map((call) => call[1]),
  };
};
