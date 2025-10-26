import { glob } from 'glob';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

jest.mock('glob');

export const globFindAdapterProxy = (): {
  returns: (params: { pattern: GlobPattern; filePaths: readonly AbsoluteFilePath[] }) => void;
} => {
  const mock = jest.mocked(glob);

  mock.mockImplementation(async () => []);

  return {
    returns: ({
      filePaths,
    }: {
      pattern: GlobPattern;
      filePaths: readonly AbsoluteFilePath[];
    }): void => {
      mock.mockResolvedValueOnce([...filePaths]);
    },
  };
};
