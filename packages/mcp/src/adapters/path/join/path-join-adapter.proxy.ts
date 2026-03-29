import { join } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathJoinAdapterProxy = (): {
  returns: ({ paths, result }: { paths: readonly string[]; result: FilePath }) => void;
} => {
  const handle = registerMock({ fn: join });

  handle.mockReturnValue('');

  return {
    returns: ({ paths: _paths, result }: { paths: readonly string[]; result: FilePath }): void => {
      handle.mockReturnValueOnce(result);
    },
  };
};
