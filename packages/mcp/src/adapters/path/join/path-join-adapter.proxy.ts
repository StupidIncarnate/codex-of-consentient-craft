import { join } from 'path';
import type * as Path from 'path';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

jest.mock('path');

export const pathJoinAdapterProxy = (): {
  returns: ({ paths, result }: { paths: readonly string[]; result: FilePath }) => void;
} => {
  const mockJoin = jest.mocked(join);

  mockJoin.mockImplementation((...segments) => {
    const actualPath = jest.requireActual<typeof Path>('path');
    return actualPath.join(...segments);
  });

  return {
    returns: ({ paths: _paths, result }: { paths: readonly string[]; result: FilePath }): void => {
      mockJoin.mockReturnValueOnce(result);
    },
  };
};
