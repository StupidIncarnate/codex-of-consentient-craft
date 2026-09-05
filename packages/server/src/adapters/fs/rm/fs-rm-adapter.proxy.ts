import { rm } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

// Some callers compute the target path from arguments the proxy never receives, so callers
// may key on either a literal path or a predicate — mirrors fs-mkdir-adapter.proxy.ts.
type FilePathMatcher = AbsoluteFilePath | ((value: unknown) => boolean);

export const fsRmAdapterProxy = (): {
  succeeds: (params: { filePath: FilePathMatcher }) => void;
  throws: (params: { filePath: FilePathMatcher; error: Error }) => void;
  getOptionsFor: (params: { filePath: FilePathMatcher }) => unknown;
} => {
  const mock = registerMock({ fn: rm });

  return {
    succeeds: ({ filePath }: { filePath: FilePathMatcher }): void => {
      mock.calledWith([filePath]).resolves(undefined);
    },
    throws: ({ filePath, error }: { filePath: FilePathMatcher; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
    // Answers "what options did rm receive for this path" — lets a test assert
    // { recursive: true, force: true } actually reached fs, not just that rm was called.
    getOptionsFor: ({ filePath }: { filePath: FilePathMatcher }): unknown =>
      mock.callsMatching([filePath]).at(-1)?.[1],
  };
};
