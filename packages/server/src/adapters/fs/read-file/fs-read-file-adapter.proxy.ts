import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '@dungeonmaster/shared/contracts';

// readFile's first argument is the caller's filepath verbatim (fsReadFileAdapter passes it
// straight through), so callers key on the real path. A predicate is also accepted for callers
// whose real path is environment-resolved (e.g. require.resolve'd) rather than test-authored.
type FilePathMatcher = FilePath | ((value: unknown) => boolean);

export const fsReadFileAdapterProxy = (): {
  returns: ({ filepath, contents }: { filepath: FilePathMatcher; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: FilePathMatcher; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFile });

  return {
    returns: ({
      filepath,
      contents,
    }: {
      filepath: FilePathMatcher;
      contents: FileContents;
    }): void => {
      mock.calledWith([filepath]).resolves(contents);
    },
    throws: ({ filepath, error }: { filepath: FilePathMatcher; error: Error }): void => {
      mock.calledWith([filepath]).rejects(error);
    },
  };
};
