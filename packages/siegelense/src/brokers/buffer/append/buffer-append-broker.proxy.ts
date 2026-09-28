import type { FsError } from '#gateway/node/fs';
import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const bufferAppendBrokerProxy = (): {
  succeeds: (params: { bufferPath: AbsoluteFilePath }) => void;
  throws: (params: { bufferPath: AbsoluteFilePath; error: FsError }) => void;
  appendCallsFor: (params: { bufferPath: AbsoluteFilePath }) => readonly unknown[];
  writtenEntriesFor: (params: { bufferPath: AbsoluteFilePath }) => unknown[];
} => {
  const appendProxy = appendFileProxy();

  // Every raw string this path was appended with, IN CALL ORDER — an empty result is what proves
  // `appendFile` was never invoked, which a parsed/filtered view could not tell apart from a call
  // written with an empty string.
  const appendCallsFor = ({ bufferPath }: { bufferPath: AbsoluteFilePath }): readonly unknown[] =>
    appendProxy.getCallsFor({ path: bufferPath }).map((call) => call[1]);

  return {
    succeeds: ({ bufferPath }: { bufferPath: AbsoluteFilePath }): void => {
      appendProxy.succeeds({ path: bufferPath });
    },

    throws: ({ bufferPath, error }: { bufferPath: AbsoluteFilePath; error: FsError }): void => {
      appendProxy.rejects({ path: bufferPath, error });
    },

    appendCallsFor,

    // Every line across every call to this path, parsed back from JSON — proof the bytes on disk are
    // exactly the entries the broker was handed, not just that a write happened.
    writtenEntriesFor: ({ bufferPath }: { bufferPath: AbsoluteFilePath }): unknown[] =>
      appendCallsFor({ bufferPath })
        .flatMap((chunk) => String(chunk).split('\n'))
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line)),
  };
};
