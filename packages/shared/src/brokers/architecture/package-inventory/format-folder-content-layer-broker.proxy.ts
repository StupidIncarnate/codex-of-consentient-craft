import type { Dirent } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { countFilesRecursiveLayerBrokerProxy } from './count-files-recursive-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { DirEntrySync } from '#gateway/node/fs';
import { DirentStub } from '#gateway/node/fs/readdir-entries-sync/dirent.stub';

// Feeds `safeProxy.setupDirectory`, which composes the gateway's own `readdirEntriesSyncProxy` —
// that proxy stages `{name, kind}` directly, never a raw `Dirent`.
const makeDirEntrySync = ({ name, isDir }: { name: string; isDir: boolean }): DirEntrySync => ({
  name,
  kind: isDir ? 'directory' : 'file',
});

// Feeds `safeProxy.setupImplementation`, which registers directly on the raw `readdirSync` mock —
// the gateway's own real `.map()` into `{name, kind}` still runs underneath, so this must keep
// building the shape the real fs.Dirent's `isDirectory()`/`isFile()` methods provide.
const makeDirent = ({ name, isDir }: { name: string; isDir: boolean }): Dirent =>
  DirentStub({ name, kind: isDir ? 'directory' : 'file' });

export const formatFolderContentLayerBrokerProxy = (): {
  setupDepth0Files: ({
    dirPath,
    fileNames,
  }: {
    dirPath: AbsoluteFilePath;
    fileNames: string[];
  }) => void;
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
  setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }) => void;
} => {
  const safeProxy = safeReaddirLayerBrokerProxy();
  countFilesRecursiveLayerBrokerProxy();

  return {
    setupDepth0Files: ({
      dirPath,
      fileNames,
    }: {
      dirPath: AbsoluteFilePath;
      fileNames: string[];
    }): void => {
      safeProxy.setupDirectory({
        dirPath,
        entries: fileNames.map((name) => makeDirEntrySync({ name, isDir: false })),
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

    setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      safeProxy.setupDirectory({ dirPath, entries: [] });
    },
  };
};
