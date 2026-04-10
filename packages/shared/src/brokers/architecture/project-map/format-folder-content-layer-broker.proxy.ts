import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { countFilesRecursiveLayerBrokerProxy } from './count-files-recursive-layer-broker.proxy';

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
  setupDepth1WithEmpty: ({ subdirs }: { subdirs: { name: string; hasFiles: boolean }[] }) => void;
  setupDepth2Domains: ({ domains }: { domains: { name: string; actions: string[] }[] }) => void;
  setupDepth2WithEmpty: ({
    domains,
  }: {
    domains: {
      name: string;
      directFiles?: string[];
      actions: { name: string; hasFiles: boolean }[];
    }[];
  }) => void;
  setupEmpty: () => void;
} => {
  const safeProxy = safeReaddirLayerBrokerProxy();
  countFilesRecursiveLayerBrokerProxy();

  return {
    setupDepth0Files: ({ fileNames }: { fileNames: string[] }): void => {
      safeProxy.setupDirectory({
        entries: fileNames.map((name) => makeDirent({ name, isDir: false })),
      });
    },

    setupDepth1Subdirs: ({ subdirNames }: { subdirNames: string[] }): void => {
      safeProxy.setupImplementation({
        fn: (path: string): Dirent[] => {
          for (const name of subdirNames) {
            if (path.endsWith(`/${name}`)) {
              return [makeDirent({ name: 'file-1.ts', isDir: false })];
            }
          }
          return subdirNames.map((name) => makeDirent({ name, isDir: true }));
        },
      });
    },

    setupDepth1WithEmpty: ({
      subdirs,
    }: {
      subdirs: { name: string; hasFiles: boolean }[];
    }): void => {
      safeProxy.setupImplementation({
        fn: (path: string): Dirent[] => {
          for (const sub of subdirs) {
            if (path.endsWith(`/${sub.name}`)) {
              return sub.hasFiles ? [makeDirent({ name: 'file-1.ts', isDir: false })] : [];
            }
          }
          return subdirs.map((s) => makeDirent({ name: s.name, isDir: true }));
        },
      });
    },

    setupDepth2Domains: ({ domains }: { domains: { name: string; actions: string[] }[] }): void => {
      safeProxy.setupImplementation({
        fn: (path: string): Dirent[] => {
          for (const domain of domains) {
            for (const action of domain.actions) {
              if (path.endsWith(`/${domain.name}/${action}`)) {
                return [makeDirent({ name: 'file-1.ts', isDir: false })];
              }
            }
            if (path.endsWith(`/${domain.name}`)) {
              return domain.actions.map((action) => makeDirent({ name: action, isDir: true }));
            }
          }
          return domains.map((d) => makeDirent({ name: d.name, isDir: true }));
        },
      });
    },

    setupDepth2WithEmpty: ({
      domains,
    }: {
      domains: {
        name: string;
        directFiles?: string[];
        actions: { name: string; hasFiles: boolean }[];
      }[];
    }): void => {
      safeProxy.setupImplementation({
        fn: (path: string): Dirent[] => {
          for (const domain of domains) {
            for (const action of domain.actions) {
              if (path.endsWith(`/${domain.name}/${action.name}`)) {
                return action.hasFiles ? [makeDirent({ name: 'file-1.ts', isDir: false })] : [];
              }
            }
            if (path.endsWith(`/${domain.name}`)) {
              const files = (domain.directFiles ?? []).map((f) =>
                makeDirent({ name: f, isDir: false }),
              );
              const actionDirs = domain.actions.map((a) =>
                makeDirent({ name: a.name, isDir: true }),
              );
              return [...files, ...actionDirs];
            }
          }
          return domains.map((d) => makeDirent({ name: d.name, isDir: true }));
        },
      });
    },

    setupEmpty: (): void => {
      safeProxy.setupDirectory({ entries: [] });
    },
  };
};
