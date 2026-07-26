import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

const buildDirDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const stateDirsFindLayerBrokerProxy = (): {
  setupStateDirs: ({
    packageRoot,
    names,
  }: {
    packageRoot: AbsoluteFilePath;
    names: string[];
  }) => void;
  setupEmpty: ({ packageRoot }: { packageRoot: AbsoluteFilePath }) => void;
  setupMissing: ({ packageRoot }: { packageRoot: AbsoluteFilePath }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupStateDirs: ({
      packageRoot,
      names,
    }: {
      packageRoot: AbsoluteFilePath;
      names: string[];
    }): void => {
      const entries = names.map((name) => buildDirDirent({ name }));
      const dirPath = AbsoluteFilePathStub({ value: `${String(packageRoot)}/src/state` });
      readdirProxy.setupDirectory({ dirPath, entries });
    },

    setupEmpty: ({ packageRoot }: { packageRoot: AbsoluteFilePath }): void => {
      const dirPath = AbsoluteFilePathStub({ value: `${String(packageRoot)}/src/state` });
      readdirProxy.setupDirectory({ dirPath, entries: [] });
    },

    setupMissing: ({ packageRoot }: { packageRoot: AbsoluteFilePath }): void => {
      const dirPath = AbsoluteFilePathStub({ value: `${String(packageRoot)}/src/state` });
      readdirProxy.setupError({ dirPath, error: new Error('ENOENT: no such file or directory') });
    },
  };
};
