import { unlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsUnlinkAdapterProxy = (): {
  succeeds: (params: { filePath: FilePath }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: unlink });

  return {
    succeeds: ({ filePath }: { filePath: FilePath }): void => {
      mock.calledWith([filePath]).resolves({ success: true as const });
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
