import { mkdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsMkdirAdapterProxy = (): {
  succeeds: (params: { dirPath: FilePath }) => void;
  throws: (params: { dirPath: FilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: mkdir });

  return {
    succeeds: ({ dirPath }: { dirPath: FilePath }): void => {
      mock.calledWith([dirPath]).resolves({ success: true as const });
    },
    throws: ({ dirPath, error }: { dirPath: FilePath; error: Error }): void => {
      mock.calledWith([dirPath]).rejects(error);
    },
  };
};
