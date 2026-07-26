import type { Dirent } from 'fs';
import { listDirEntriesLayerBrokerProxy } from './list-dir-entries-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const startupFilesFindLayerBrokerProxy = (): {
  setupFiles: ({
    packageSrcPath,
    names,
  }: {
    packageSrcPath: AbsoluteFilePath;
    names: string[];
  }) => void;
  setupEmpty: ({ packageSrcPath }: { packageSrcPath: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const listProxy = listDirEntriesLayerBrokerProxy();

  return {
    setupFiles: ({
      packageSrcPath,
      names,
    }: {
      packageSrcPath: AbsoluteFilePath;
      names: string[];
    }): void => {
      const dirPath = AbsoluteFilePathStub({ value: `${String(packageSrcPath)}/startup` });
      listProxy.setupFiles({ dirPath, names });
    },

    setupEmpty: ({ packageSrcPath }: { packageSrcPath: AbsoluteFilePath }): void => {
      const dirPath = AbsoluteFilePathStub({ value: `${String(packageSrcPath)}/startup` });
      listProxy.setupEmpty({ dirPath });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      listProxy.setupImplementation({ fn });
    },
  };
};
