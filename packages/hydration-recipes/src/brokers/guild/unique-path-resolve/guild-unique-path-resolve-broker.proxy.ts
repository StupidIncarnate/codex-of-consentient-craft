import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { filePathContract } from '@dungeonmaster/shared/contracts';

export const guildUniquePathResolveBrokerProxy = (): {
  setupExisting: ({ absolutePaths }: { absolutePaths: readonly string[] }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();

  return {
    // Every absolute path in the list reads back as already occupied; every other candidate the
    // broker resolves reads back free via the adapter proxy's own default (false).
    setupExisting: ({ absolutePaths }: { absolutePaths: readonly string[] }): void => {
      absolutePaths.forEach((path) => {
        existsProxy.returns({ filePath: filePathContract.parse(path), result: true });
      });
    },
  };
};
