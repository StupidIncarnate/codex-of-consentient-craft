import { appendLinesCreatingParentProxy } from '#gateway/node/fs__promises/append-lines-creating-parent/append-lines-creating-parent.proxy';
import { sessionUniqueIdResolveBrokerProxy } from '../unique-id-resolve/session-unique-id-resolve-broker.proxy';

export const sessionWriteRouteBrokerProxy = (): {
  succeeds: ({ filePath }: { filePath: string }) => void;
  setupFree: ({ filePaths }: { filePaths: readonly string[] }) => void;
  getAppendedContents: ({ filePath }: { filePath: string }) => unknown;
} => {
  const appendProxy = appendLinesCreatingParentProxy();
  const uniqueIdProxy = sessionUniqueIdResolveBrokerProxy();

  return {
    succeeds: ({ filePath }: { filePath: string }): void => {
      uniqueIdProxy.setupFree({ filePaths: [filePath] });
      appendProxy.succeeds({ path: filePath });
    },
    setupFree: ({ filePaths }: { filePaths: readonly string[] }): void => {
      uniqueIdProxy.setupFree({ filePaths });
    },
    getAppendedContents: ({ filePath }: { filePath: string }): unknown =>
      appendProxy.appendedContentsFor({ path: filePath }),
  };
};
