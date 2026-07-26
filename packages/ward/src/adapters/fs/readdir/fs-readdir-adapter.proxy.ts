import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReaddirAdapterProxy = (): {
  returns: (params: { dirPath: FilePath; entries: string[] }) => void;
  throws: (params: { dirPath: FilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readdir });

  return {
    returns: ({ dirPath, entries }: { dirPath: FilePath; entries: string[] }): void => {
      mock.calledWith([dirPath]).resolves(entries as never);
    },
    throws: ({ dirPath, error }: { dirPath: FilePath; error: Error }): void => {
      mock.calledWith([dirPath]).rejects(error);
    },
  };
};
