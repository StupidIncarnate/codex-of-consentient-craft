import { readdirSync, statSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

export const fsWalkFilesAdapterProxy = (): {
  setupDirectory: (params: {
    dirPath: AbsoluteFilePath;
    files: readonly string[];
    dirs?: readonly string[];
  }) => void;
  setupUnreadableDirectory: (params: { dirPath: AbsoluteFilePath }) => void;
  setupFileStat: (params: { filePath: AbsoluteFilePath; mtimeMs: number; size: number }) => void;
  setupMissingFileStat: (params: { filePath: AbsoluteFilePath }) => void;
} => {
  const readdirHandle = registerMock({ fn: readdirSync });
  const statHandle = registerMock({ fn: statSync });

  return {
    // The adapter asks for dirents, so each entry answers isDirectory/isFile the way fs does.
    setupDirectory: ({
      dirPath,
      files,
      dirs = [],
    }: {
      dirPath: AbsoluteFilePath;
      files: readonly string[];
      dirs?: readonly string[];
    }): void => {
      readdirHandle.calledWith([dirPath, { withFileTypes: true }]).returns([
        ...dirs.map((name) => ({
          name,
          isDirectory: (): boolean => true,
          isFile: (): boolean => false,
        })),
        ...files.map((name) => ({
          name,
          isDirectory: (): boolean => false,
          isFile: (): boolean => true,
        })),
      ] as never);
    },

    setupUnreadableDirectory: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      readdirHandle
        .calledWith([dirPath, { withFileTypes: true }])
        .throws(new Error('EACCES: permission denied'));
    },

    setupFileStat: ({
      filePath,
      mtimeMs,
      size,
    }: {
      filePath: AbsoluteFilePath;
      mtimeMs: number;
      size: number;
    }): void => {
      statHandle.calledWith([filePath]).returns({ mtimeMs, size } as never);
    },

    setupMissingFileStat: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      statHandle.calledWith([filePath]).throws(new Error('ENOENT: no such file or directory'));
    },
  };
};
