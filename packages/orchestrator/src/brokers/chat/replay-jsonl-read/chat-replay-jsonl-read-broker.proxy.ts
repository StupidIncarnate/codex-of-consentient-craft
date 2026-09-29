import { readNonEmptyLinesProxy } from '#gateway/node/fs__promises/read-non-empty-lines/read-non-empty-lines.proxy';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';
import type { FsError } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const chatReplayJsonlReadBrokerProxy = (): {
  returns: (params: { filePath: AbsoluteFilePath; content: string }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: FsError }) => void;
  throwsOnce: (params: { filePath: AbsoluteFilePath; error: FsError }) => void;
} => {
  const readLinesProxy = readNonEmptyLinesProxy();
  // Passes through by default: the retry waits a real 20ms between reads.
  setTimeoutProxy();
  return {
    returns: ({ filePath, content }: { filePath: AbsoluteFilePath; content: string }): void => {
      readLinesProxy.returnsRaw({ path: String(filePath), rawContents: content });
    },
    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: FsError }): void => {
      readLinesProxy.throwsMatchingPath({ path: String(filePath), error });
    },
    throwsOnce: ({ filePath, error }: { filePath: AbsoluteFilePath; error: FsError }): void => {
      readLinesProxy.throwsOnce({ path: String(filePath), error });
    },
  };
};
