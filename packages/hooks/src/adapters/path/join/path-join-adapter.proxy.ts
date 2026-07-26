import { join } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathJoinAdapterProxy = (): {
  returns: ({ paths, result }: { paths: string[]; result: FilePath }) => void;
  getHandle: () => MockHandle;
} => {
  // Mock the npm package, not the adapter
  const mock = registerMock({ fn: join });

  return {
    // Semantic method for staging a specific segment combination
    returns: ({ paths, result }: { paths: string[]; result: FilePath }): void => {
      mock.calledWith(paths).returns(result);
    },
    getHandle: () => mock,
  };
};
