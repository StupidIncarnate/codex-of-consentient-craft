import { Dirent } from 'fs';

import {
  fsReaddirWithTypesAdapterProxy,
  osUserHomedirAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

const createMockDirent = ({
  name,
  parentPath,
  isDirectory,
}: {
  name: string;
  parentPath: string;
  isDirectory: boolean;
}): Dirent => {
  const dirent = Object.assign(Object.create(Dirent.prototype) as Dirent, {
    name,
    parentPath,
    isDirectory: jest.fn().mockReturnValue(isDirectory),
  });
  return dirent;
};

export const directoryBrowseBrokerProxy = (): {
  setupDirectories: (params: {
    targetPath: string;
    directories: { name: string; joinedPath: FilePath }[];
    files: string[];
    hiddenDirectories: string[];
  }) => void;
  setupDefaultHomedir: (params: {
    homeDir: string;
    directories: { name: string; joinedPath: FilePath }[];
  }) => void;
  setupEmpty: (params: { targetPath: string }) => void;
  setupThrows: (params: { targetPath: string; error: Error }) => void;
} => {
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const homedirProxy = osUserHomedirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupDirectories: ({
      targetPath,
      directories,
      files,
      hiddenDirectories,
    }: {
      targetPath: string;
      directories: { name: string; joinedPath: FilePath }[];
      files: string[];
      hiddenDirectories: string[];
    }): void => {
      const allEntries = [
        ...directories.map(({ name }) =>
          createMockDirent({ name, parentPath: targetPath, isDirectory: true }),
        ),
        ...files.map((name) =>
          createMockDirent({ name, parentPath: targetPath, isDirectory: false }),
        ),
        ...hiddenDirectories.map((name) =>
          createMockDirent({ name, parentPath: targetPath, isDirectory: true }),
        ),
      ];

      readdirProxy.returns({
        dirPath: absoluteFilePathContract.parse(targetPath),
        entries: allEntries,
      });

      for (const { joinedPath } of directories) {
        pathJoinProxy.returns({ result: joinedPath });
      }
    },

    setupDefaultHomedir: ({
      homeDir,
      directories,
    }: {
      homeDir: string;
      directories: { name: string; joinedPath: FilePath }[];
    }): void => {
      homedirProxy.returns({ path: homeDir });

      const allEntries = directories.map(({ name }) =>
        createMockDirent({ name, parentPath: homeDir, isDirectory: true }),
      );

      readdirProxy.returns({
        dirPath: absoluteFilePathContract.parse(homeDir),
        entries: allEntries,
      });

      for (const { joinedPath } of directories) {
        pathJoinProxy.returns({ result: joinedPath });
      }
    },

    setupEmpty: ({ targetPath }: { targetPath: string }): void => {
      readdirProxy.returns({ dirPath: absoluteFilePathContract.parse(targetPath), entries: [] });
    },

    setupThrows: ({ targetPath, error }: { targetPath: string; error: Error }): void => {
      readdirProxy.throws({ dirPath: absoluteFilePathContract.parse(targetPath), error });
    },
  };
};
