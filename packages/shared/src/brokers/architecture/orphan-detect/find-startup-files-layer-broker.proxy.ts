import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const findStartupFilesLayerBrokerProxy = (): {
  setupReturns: ({
    packageSrcPath,
    entries,
  }: {
    packageSrcPath: AbsoluteFilePath;
    entries: Dirent[];
  }) => void;
  setupReaddirThrows: ({
    packageSrcPath,
    error,
  }: {
    packageSrcPath: AbsoluteFilePath;
    error: Error;
  }) => void;
  setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  return {
    setupReturns: ({
      packageSrcPath,
      entries,
    }: {
      packageSrcPath: AbsoluteFilePath;
      entries: Dirent[];
    }): void => {
      const dirPath = AbsoluteFilePathStub({ value: `${String(packageSrcPath)}/startup` });
      readdirProxy.setupReaddirReturns({ dirPath, entries });
    },
    setupReaddirThrows: ({
      packageSrcPath,
      error,
    }: {
      packageSrcPath: AbsoluteFilePath;
      error: Error;
    }): void => {
      const dirPath = AbsoluteFilePathStub({ value: `${String(packageSrcPath)}/startup` });
      readdirProxy.setupReaddirThrows({ dirPath, error });
    },
    setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.setupReaddirImplementation({ fn });
    },
  };
};
