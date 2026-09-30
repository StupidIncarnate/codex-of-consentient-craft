import type { Dirent } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { DirentStub } from '#gateway/node/fs/readdir-entries-sync/dirent.stub';

export const hasResponderCreateLayerBrokerProxy = (): {
  setupWithCreate: ({ domainName }: { domainName: string }) => void;
  setupWithoutCreate: ({ domainNames }: { domainNames: readonly string[] }) => void;
  setupEmpty: ({ respondersDirPath }: { respondersDirPath: string }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  const makeFileDirent = ({ name }: { name: string }): Dirent => DirentStub({ name, kind: 'file' });

  const makeDirDirent = ({ name }: { name: string }): Dirent =>
    DirentStub({ name, kind: 'directory' });

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

    setupEmpty: ({ respondersDirPath }: { respondersDirPath: string }): void => {
      readdirProxy.setupDirectory({ dirPath: respondersDirPath, entries: [] });
    },
  };
};
