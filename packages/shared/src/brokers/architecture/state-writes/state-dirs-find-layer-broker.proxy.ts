import type { DirEntrySync } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const buildDirDirent = ({ name }: { name: string }): DirEntrySync => ({ name, kind: 'directory' });

export const stateDirsFindLayerBrokerProxy = (): {
  setupStateDirs: ({
    packageRoot,
    names,
  }: {
    packageRoot: string;
    names: string[];
  }) => void;
  setupEmpty: ({ packageRoot }: { packageRoot: string }) => void;
  setupMissing: ({ packageRoot }: { packageRoot: string }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupStateDirs: ({
      packageRoot,
      names,
    }: {
      packageRoot: string;
      names: string[];
    }): void => {
      const entries = names.map((name) => buildDirDirent({ name }));
      const dirPath = `${String(packageRoot)}/src/state`;
      readdirProxy.setupDirectory({ dirPath, entries });
    },

    setupEmpty: ({ packageRoot }: { packageRoot: string }): void => {
      const dirPath = `${String(packageRoot)}/src/state`;
      readdirProxy.setupDirectory({ dirPath, entries: [] });
    },

    setupMissing: ({ packageRoot }: { packageRoot: string }): void => {
      const dirPath = `${String(packageRoot)}/src/state`;
      readdirProxy.setupError({ dirPath, error: FileMissingErrorStub({ path: dirPath }) });
    },
  };
};
