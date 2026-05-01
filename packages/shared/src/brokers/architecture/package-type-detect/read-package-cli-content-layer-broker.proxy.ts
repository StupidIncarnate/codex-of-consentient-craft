import type { Dirent } from 'fs';

import { readFileOptionalLayerBrokerProxy } from './read-file-optional-layer-broker.proxy';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const makeFileDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

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
              return ContentTextStub({ value: content });
            }
          }
          for (const [name, content] of Object.entries(binFiles)) {
            if (filePathStr === `${packageRoot}/bin/${name}`) {
              return ContentTextStub({ value: content });
            }
          }
          throw new Error('ENOENT');
        },
      });
    },
  };
};
