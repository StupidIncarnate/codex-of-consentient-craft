// PURPOSE: Stages one directory level of an evidence tree at a time — its existence, its entries
// (files and subdirectories) and each file's size — all keyed on the directory's own path, so a
// test builds a nested tree by calling `setupDir` once per directory and levels never collide.
// `setupMissingDir` stages a directory that is not there.
// USAGE: const proxy = evidenceTreeLayerBrokerProxy();
//        proxy.setupDir({ dirPath: '/home/u/inst_1', files: [{ name: 'api-server.log', bytes: 10 }], dirs: ['runs'] });

import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readdirEntriesProxy } from '#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';

export const evidenceTreeLayerBrokerProxy = (): {
  setupDir: (params: {
    dirPath: string;
    files: readonly { name: string; bytes: number }[];
    dirs?: readonly string[];
  }) => void;
  setupMissingDir: (params: { dirPath: string }) => void;
} => {
  const existsProxy = pathExistsProxy();
  const readdirProxy = readdirEntriesProxy();
  const statProxy = statIfExistsProxy();

  return {
    setupDir: ({
      dirPath,
      files,
      dirs = [],
    }: {
      dirPath: string;
      files: readonly { name: string; bytes: number }[];
      dirs?: readonly string[];
    }): void => {
      existsProxy.present({ path: dirPath });
      readdirProxy.returns({
        path: dirPath,
        entries: [
          ...files.map(({ name }) => ({ name, kind: 'file' as const })),
          ...dirs.map((name) => ({ name, kind: 'directory' as const })),
        ],
      });
      files.forEach(({ name, bytes }) => {
        statProxy.returnsFile({
          path: `${dirPath}/${name}`,
          sizeBytes: bytes,
          modifiedAtMs: 0,
        });
      });
    },
    setupMissingDir: ({ dirPath }: { dirPath: string }): void => {
      existsProxy.missing({ path: dirPath });
    },
  };
};
