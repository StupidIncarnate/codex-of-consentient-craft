import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

const makeDirent = ({ name, isDir }: { name: string; isDir: boolean }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const formatFolderContentLayerBrokerProxy = (): {
  setupDepth0Files: ({ fileNames }: { fileNames: string[] }) => void;
  setupDepth1Subdirs: ({ subdirNames }: { subdirNames: string[] }) => void;
  setupDepth2Domains: ({ domains }: { domains: { name: string; actions: string[] }[] }) => void;
  setupEmpty: () => void;
} => {
  const safeProxy = safeReaddirLayerBrokerProxy();

  return {
    setupDepth0Files: ({ fileNames }: { fileNames: string[] }): void => {
      safeProxy.setupDirectory({
        entries: fileNames.map((name) => makeDirent({ name, isDir: false })),
      });
    },

    setupDepth1Subdirs: ({ subdirNames }: { subdirNames: string[] }): void => {
      safeProxy.setupDirectory({
        entries: subdirNames.map((name) => makeDirent({ name, isDir: true })),
      });
    },

    setupDepth2Domains: ({ domains }: { domains: { name: string; actions: string[] }[] }): void => {
      safeProxy.setupDirectory({
        entries: domains.map((domain) => makeDirent({ name: domain.name, isDir: true })),
      });

      for (const domain of domains) {
        safeProxy.setupDirectory({
          entries: domain.actions.map((action) => makeDirent({ name: action, isDir: true })),
        });
      }
    },

    setupEmpty: (): void => {
      safeProxy.setupDirectory({ entries: [] });
    },
  };
};
