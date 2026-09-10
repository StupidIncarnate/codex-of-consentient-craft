import { unlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsUnlinkAdapterProxy = (): {
  succeeds: (params: { filePath: FilePath }) => void;
  succeedsForAnyPath: () => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
  getDeletedPaths: () => unknown[];
} => {
  const mock = registerMock({ fn: unlink });

  return {
    succeeds: ({ filePath }: { filePath: FilePath }): void => {
      mock.calledWith([filePath]).resolves({ success: true as const });
    },
    // For a caller that deletes a set it decides for itself — a sweep picking its own paths —
    // where naming each path in advance would stage the very answer under test.
    succeedsForAnyPath: (): void => {
      mock.calledWith([]).implement(() => undefined);
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
    // WHICH paths were deleted, one entry per call, in call order. A sweep's whole behaviour is the
    // set it chose, so asserting only that the adapter "was called" passes equally against a sweep
    // that deleted the wrong file, or every file.
    // Deliberately un-narrowed: a test asserts this shape with toStrictEqual rather than having the
    // proxy cast it first.
    getDeletedPaths: (): unknown[] => mock.callsMatching([]).map((call) => call[0]),
  };
};
