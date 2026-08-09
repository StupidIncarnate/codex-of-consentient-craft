import { readlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReadlinkAdapterProxy = (): {
  returns: (params: { linkPath: FilePath; target: string }) => void;
  throws: (params: { linkPath: FilePath; error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: readlink });

  return {
    returns: ({ linkPath, target }: { linkPath: FilePath; target: string }): void => {
      mock.calledWith([linkPath]).resolves(target);
    },

    throws: ({ linkPath, error }: { linkPath: FilePath; error: Error }): void => {
      mock.calledWith([linkPath]).rejects(error);
    },
  };
};
