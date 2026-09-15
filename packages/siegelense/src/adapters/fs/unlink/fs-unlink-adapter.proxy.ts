import { unlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsUnlinkAdapterProxy = (): {
  succeeds: (params: { filePath: AbsoluteFilePath }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  getDeletedPaths: () => unknown[];
} => {
  const mock: MockHandle = registerMock({ fn: unlink });

  return {
    succeeds: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      mock.calledWith([filePath]).resolves(undefined);
    },

    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },

    getDeletedPaths: (): unknown[] => mock.callsMatching([]).map((call) => call[0]),
  };
};
