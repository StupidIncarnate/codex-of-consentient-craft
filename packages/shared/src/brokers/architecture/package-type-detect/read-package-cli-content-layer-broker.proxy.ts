import type { Dirent } from '#gateway/node/fs';

import { readFileOptionalLayerBrokerProxy } from './read-file-optional-layer-broker.proxy';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';
import { DirentStub } from '#gateway/node/fs/readdir-entries-sync/dirent.stub';

const makeFileDirent = ({ name }: { name: string }): Dirent => DirentStub({ name, kind: 'file' });

export const readPackageCliContentLayerBrokerProxy = (): {
  setupPackage: ({
    packageRoot,
    startupFiles,
    binFiles,
  }: {
    packageRoot: string;
    startupFiles?: Record<string, string>;
    binFiles?: Record<string, string>;
  }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  const readFileProxy = readFileOptionalLayerBrokerProxy();

  return {
    setupPackage: ({
      packageRoot,
      startupFiles = {},
      binFiles = {},
    }: {
      packageRoot: string;
      startupFiles?: Record<string, string>;
      binFiles?: Record<string, string>;
    }): void => {
      readdirProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          if (dirPath === `${packageRoot}/src/startup`) {
            return Object.keys(startupFiles).map((name) => makeFileDirent({ name }));
          }
          if (dirPath === `${packageRoot}/bin`) {
            return Object.keys(binFiles).map((name) => makeFileDirent({ name }));
          }
          return [];
        },
      });

      readFileProxy.setupImplementation({
        fn: (filePath) => {
          const filePathStr = String(filePath);
          for (const [name, content] of Object.entries(startupFiles)) {
            if (filePathStr === `${packageRoot}/src/startup/${name}`) {
              return content;
            }
          }
          for (const [name, content] of Object.entries(binFiles)) {
            if (filePathStr === `${packageRoot}/bin/${name}`) {
              return content;
            }
          }
          throw FileMissingErrorStub({ path: filePathStr });
        },
      });
    },
  };
};
