import type { Dirent } from '#gateway/node/fs';
import type { DirEntrySync } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

export const findStartupFilesLayerBrokerProxy = (): {
  setupReturns: ({
    packageSrcPath,
    entries,
  }: {
    packageSrcPath: string;
    entries: DirEntrySync[];
  }) => void;
  setupReaddirThrows: ({ packageSrcPath, error }: { packageSrcPath: string; error: Error }) => void;
  setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  return {
    setupReturns: ({
      packageSrcPath,
      entries,
    }: {
      packageSrcPath: string;
      entries: DirEntrySync[];
    }): void => {
      const dirPath = `${packageSrcPath}/startup`;
      readdirProxy.setupReaddirReturns({ dirPath, entries });
    },
    setupReaddirThrows: ({
      packageSrcPath,
      error,
    }: {
      packageSrcPath: string;
      error: Error;
    }): void => {
      const dirPath = `${packageSrcPath}/startup`;
      readdirProxy.setupReaddirThrows({ dirPath, error });
    },
    setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.setupReaddirImplementation({ fn });
    },
  };
};
