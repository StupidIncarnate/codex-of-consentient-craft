import type { FsError } from '#gateway/node/fs';
import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';

export const bufferAppendBrokerProxy = (): {
  succeeds: (params: { bufferPath: string }) => void;
  throws: (params: { bufferPath: string; error: FsError }) => void;
  appendCallsFor: (params: { bufferPath: string }) => readonly unknown[];
  writtenEntriesFor: (params: { bufferPath: string }) => unknown[];
} => {
  const appendProxy = appendFileProxy();

  // Every raw string this path was appended with, IN CALL ORDER — an empty result is what proves
  // `appendFile` was never invoked, which a parsed/filtered view could not tell apart from a call
  // written with an empty string.
  const appendCallsFor = ({ bufferPath }: { bufferPath: string }): readonly unknown[] =>
    appendProxy.getCallsFor({ path: bufferPath }).map((call) => call[1]);

  return {
    succeeds: ({ bufferPath }: { bufferPath: string }): void => {
      appendProxy.succeeds({ path: bufferPath });
    },

    throws: ({ bufferPath, error }: { bufferPath: string; error: FsError }): void => {
      appendProxy.rejects({ path: bufferPath, error });
    },

    appendCallsFor,

    // Every line across every call to this path, parsed back from JSON — proof the bytes on disk are
    // exactly the entries the broker was handed, not just that a write happened.
    writtenEntriesFor: ({ bufferPath }: { bufferPath: string }): unknown[] =>
      appendCallsFor({ bufferPath })
        .flatMap((chunk) => String(chunk).split('\n'))
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line)),
  };
};
