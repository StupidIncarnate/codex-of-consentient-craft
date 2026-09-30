import { readNonEmptyLinesProxy } from '#gateway/node/fs__promises/read-non-empty-lines/read-non-empty-lines.proxy';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';
import type { FsError } from '#gateway/node/fs';

export const chatReplayJsonlReadBrokerProxy = (): {
  returns: (params: { filePath: string; content: string }) => void;
  throws: (params: { filePath: string; error: FsError }) => void;
  throwsOnce: (params: { filePath: string; error: FsError }) => void;
} => {
  const readLinesProxy = readNonEmptyLinesProxy();
  // Passes through by default: the retry waits a real 20ms between reads.
  setTimeoutProxy();
  return {
    returns: ({ filePath, content }: { filePath: string; content: string }): void => {
      readLinesProxy.returnsRaw({ path: filePath, rawContents: content });
    },
    throws: ({ filePath, error }: { filePath: string; error: FsError }): void => {
      readLinesProxy.throwsMatchingPath({ path: filePath, error });
    },
    throwsOnce: ({ filePath, error }: { filePath: string; error: FsError }): void => {
      readLinesProxy.throwsOnce({ path: filePath, error });
    },
  };
};
