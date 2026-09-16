import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';

export const bufferAppendBrokerProxy = (): {
  succeeds: (params: { bufferPath: AbsoluteFilePath }) => void;
  throws: (params: { bufferPath: AbsoluteFilePath; error: Error }) => void;
  appendCallsFor: (params: { bufferPath: AbsoluteFilePath }) => readonly unknown[];
  writtenEntriesFor: (params: { bufferPath: AbsoluteFilePath }) => unknown[];
} => {
  const appendProxy = fsAppendFileAdapterProxy();

  return {
    succeeds: ({ bufferPath }: { bufferPath: AbsoluteFilePath }): void => {
      appendProxy.succeeds({ filePath: bufferPath });
    },

    throws: ({ bufferPath, error }: { bufferPath: AbsoluteFilePath; error: Error }): void => {
      appendProxy.throws({ filePath: bufferPath, error });
    },

    // Every raw string this path was appended with, IN CALL ORDER — an empty result here is what
    // proves the adapter was never invoked, which a parsed/filtered view could not tell apart from a
    // call written with an empty string.
    appendCallsFor: ({ bufferPath }: { bufferPath: AbsoluteFilePath }): readonly unknown[] =>
      appendProxy.getAppendedFor({ filePath: bufferPath }),

    // Every line across every call to this path, parsed back from JSON — proof the bytes on disk are
    // exactly the entries the broker was handed, not just that a write happened.
    writtenEntriesFor: ({ bufferPath }: { bufferPath: AbsoluteFilePath }): unknown[] =>
      appendProxy
        .getAppendedFor({ filePath: bufferPath })
        .flatMap((chunk) => String(chunk).split('\n'))
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line)),
  };
};
