import { mkdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

// Some callers compute the target path from arguments the proxy never receives, so callers
// may key on either a literal path or a predicate.
type FilePathMatcher = AbsoluteFilePath | ((value: unknown) => boolean);

export const fsMkdirAdapterProxy = (): {
  succeeds: (params: { dirPath: FilePathMatcher }) => void;
  throws: (params: { dirPath: FilePathMatcher; error: Error }) => void;
  getOptionsFor: (params: { dirPath: FilePathMatcher }) => unknown;
} => {
  const mock = registerMock({ fn: mkdir });

  return {
    succeeds: ({ dirPath }: { dirPath: FilePathMatcher }): void => {
      mock.calledWith([dirPath]).resolves(undefined);
    },
    throws: ({ dirPath, error }: { dirPath: FilePathMatcher; error: Error }): void => {
      mock.calledWith([dirPath]).rejects(error);
    },
    // Answers "what options did mkdir receive for this path" — lets a test assert
    // { recursive: true } actually reached fs, not just that mkdir was called.
    getOptionsFor: ({ dirPath }: { dirPath: FilePathMatcher }): unknown =>
      mock.callsMatching([dirPath]).at(-1)?.[1],
  };
};
