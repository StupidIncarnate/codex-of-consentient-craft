import { realpath } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

// Keyed on the path alone, the same address fs-read-file-bytes-adapter.proxy.ts uses — a test
// staging both proxies describes each call by its real path, so the two never compete.
type FilePathMatcher = AbsoluteFilePath | ((value: unknown) => boolean);

export const fsRealpathAdapterProxy = (): {
  returns: (params: { filePath: FilePathMatcher; realPath: AbsoluteFilePath }) => void;
  throws: (params: { filePath: FilePathMatcher; error: Error }) => void;
} => {
  const mock = registerMock({ fn: realpath });

  return {
    returns: ({
      filePath,
      realPath,
    }: {
      filePath: FilePathMatcher;
      realPath: AbsoluteFilePath;
    }): void => {
      mock.calledWith([filePath]).resolves(realPath);
    },
    throws: ({ filePath, error }: { filePath: FilePathMatcher; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
