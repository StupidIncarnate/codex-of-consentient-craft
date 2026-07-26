import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const globFindAdapterProxy = (): {
  returns: (params: { pattern: GlobPattern; filePaths: readonly AbsoluteFilePath[] }) => void;
  throws: (params: { pattern: GlobPattern; error: Error }) => void;
} => {
  const mock = registerMock({ fn: glob });

  return {
    returns: ({
      pattern,
      filePaths,
    }: {
      pattern: GlobPattern;
      filePaths: readonly AbsoluteFilePath[];
    }): void => {
      mock.calledWith([pattern]).resolves([...filePaths]);
    },

    throws: ({ pattern, error }: { pattern: GlobPattern; error: Error }): void => {
      mock.calledWith([pattern]).rejects(error);
    },
  };
};
