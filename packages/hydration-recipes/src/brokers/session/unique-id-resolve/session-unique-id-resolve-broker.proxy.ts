import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { filePathContract } from '@dungeonmaster/shared/contracts';

export const sessionUniqueIdResolveBrokerProxy = (): {
  setupExisting: ({ filePaths }: { filePaths: readonly string[] }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();

  return {
    // Every path in the list reads back as an already-written transcript; every other candidate
    // the broker resolves reads back free via the adapter proxy's own default (false).
    setupExisting: ({ filePaths }: { filePaths: readonly string[] }): void => {
      filePaths.forEach((path) => {
        existsProxy.returns({ filePath: filePathContract.parse(path), result: true });
      });
    },
  };
};
