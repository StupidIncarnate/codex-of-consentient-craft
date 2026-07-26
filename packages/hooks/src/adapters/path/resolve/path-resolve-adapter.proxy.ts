import { resolve } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathResolveAdapterProxy = (): {
  returns: ({ paths, path }: { paths: string[]; path: FilePath }) => void;
  getHandle: () => MockHandle;
} => {
  const mock = registerMock({ fn: resolve });

  return {
    returns: ({ paths, path }: { paths: string[]; path: FilePath }): void => {
      mock.calledWith(paths).returns(path);
    },
    getHandle: () => mock,
  };
};
