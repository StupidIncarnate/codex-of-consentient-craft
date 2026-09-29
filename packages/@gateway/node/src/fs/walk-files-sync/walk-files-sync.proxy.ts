import { readdirSync, statSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const walkFilesSyncProxy = (): {
  setupDirectory: (params: {
    dirPath: string;
    files: readonly string[];
    dirs?: readonly string[];
  }) => void;
  setupUnreadableDirectory: (params: { dirPath: string; error: NodeJS.ErrnoException }) => void;
  setupFileStat: (params: { filePath: string; sizeBytes: number; modifiedAtMs: number }) => void;
  setupMissingFileStat: (params: { filePath: string; error: NodeJS.ErrnoException }) => void;
  getCallsFor: (params: { seam: 'readdirSync' | 'statSync'; path: string }) => readonly unknown[][];
} => {
  const readdirHandle = registerMock({ fn: readdirSync });
  const statHandle = registerMock({ fn: statSync });

  return {
    // The wrapper asks for dirents, so each entry answers isDirectory/isFile the way fs does.
    setupDirectory: ({
      dirPath,
      files,
      dirs = [],
    }: {
      dirPath: string;
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

    setupUnreadableDirectory: ({
      dirPath,
      error,
    }: {
      dirPath: string;
      error: NodeJS.ErrnoException;
    }): void => {
      readdirHandle.calledWith([dirPath, { withFileTypes: true }]).implement((): never => {
        throw error;
      });
    },

    setupFileStat: ({
      filePath,
      sizeBytes,
      modifiedAtMs,
    }: {
      filePath: string;
      sizeBytes: number;
      modifiedAtMs: number;
    }): void => {
      statHandle
        .calledWith([filePath])
        .returns({ size: sizeBytes, mtimeMs: modifiedAtMs } as never);
    },

    setupMissingFileStat: ({
      filePath,
      error,
    }: {
      filePath: string;
      error: NodeJS.ErrnoException;
    }): void => {
      statHandle.calledWith([filePath]).implement((): never => {
        throw error;
      });
    },

    // readdirSync is addressed by the directory plus the dirent option the wrapper always passes;
    // statSync by the file path alone.
    getCallsFor: ({ seam, path }): readonly unknown[][] =>
      seam === 'readdirSync'
        ? readdirHandle.callsMatching([path, { withFileTypes: true }])
        : statHandle.callsMatching([path]),
  };
};
