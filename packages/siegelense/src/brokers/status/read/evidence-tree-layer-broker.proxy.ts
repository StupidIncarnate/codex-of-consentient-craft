// PURPOSE: Stages one directory level of an evidence tree at a time — its existence, its entries
// (files and subdirectories) and each file's size — all keyed on the directory's own path, so a
// test builds a nested tree by calling `setupDir` once per directory and levels never collide. A
// directory nobody staged reads as absent: the shared existsSync proxy answers `false` by default.
// USAGE: const proxy = evidenceTreeLayerBrokerProxy();
//        proxy.setupDir({ dirPath: '/home/u/inst_1', files: [{ name: 'api-server.log', bytes: 10 }], dirs: ['runs'] });

import type { Dirent } from 'fs';
import {
  fsExistsSyncAdapterProxy,
  fsReaddirWithTypesAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';

import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';

const makeDirent = ({ name, isDir }: { name: string; isDir: boolean }): Dirent =>
  ({
    name,
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const evidenceTreeLayerBrokerProxy = (): {
  setupDir: (params: {
    dirPath: string;
    files: readonly { name: string; bytes: number }[];
    dirs?: readonly string[];
  }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const statProxy = fsStatAdapterProxy();

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
      existsProxy.returns({ filePath: filePathContract.parse(dirPath), result: true });
      readdirProxy.returns({
        dirPath: absoluteFilePathContract.parse(dirPath),
        entries: [
          ...files.map(({ name }) => makeDirent({ name, isDir: false })),
          ...dirs.map((name) => makeDirent({ name, isDir: true })),
        ],
      });
      files.forEach(({ name, bytes }) => {
        statProxy.resolves({
          filePath: absoluteFilePathContract.parse(`${dirPath}/${name}`),
          sizeBytes: bytes,
          modifiedAtMs: 0,
        });
      });
    },
  };
};
