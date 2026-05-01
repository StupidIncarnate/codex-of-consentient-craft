import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

export const hasResponderCreateLayerBrokerProxy = (): {
  setupWithCreate: ({ domainName }: { domainName: string }) => void;
  setupWithoutCreate: ({ domainNames }: { domainNames: readonly string[] }) => void;
  setupEmpty: () => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

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

  const makeDirDirent = ({ name }: { name: string }): Dirent =>
    ({
      name,
      isDirectory: () => true,
      isFile: () => false,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
    }) as Dirent;

  return {
    setupWithCreate: ({ domainName }: { domainName: string }): void => {
      readdirProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          if (dirPath.endsWith(`/${domainName}`) || dirPath === domainName) {
            return [makeDirDirent({ name: 'create' }), makeDirDirent({ name: 'list' })];
          }
          return [makeDirDirent({ name: domainName })];
        },
      });
    },

    setupWithoutCreate: ({ domainNames }: { domainNames: readonly string[] }): void => {
      readdirProxy.setupImplementation({
        fn: (dirPath: string): Dirent[] => {
          for (const domainName of domainNames) {
            if (dirPath.endsWith(`/${domainName}`)) {
              return [makeDirDirent({ name: 'list' }), makeFileDirent({ name: 'other.ts' })];
            }
          }
          return domainNames.map((name) => makeDirDirent({ name }));
        },
      });
    },

    setupEmpty: (): void => {
      readdirProxy.setupDirectory({ entries: [] });
    },
  };
};
