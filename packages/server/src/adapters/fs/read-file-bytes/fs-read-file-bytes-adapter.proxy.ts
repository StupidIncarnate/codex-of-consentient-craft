import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

// fs-read-file-adapter.proxy.ts mocks this same npm `readFile` keyed on the path alone, so the
// two registrations are equally specific and only collide when one test stages BOTH proxies
// against the SAME path — describe calls by their real path and that never happens.
type FilePathMatcher = AbsoluteFilePath | ((value: unknown) => boolean);

export const fsReadFileBytesAdapterProxy = (): {
  returns: (params: { filePath: FilePathMatcher; bytes: Uint8Array }) => void;
  throws: (params: { filePath: FilePathMatcher; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFile });

  return {
    returns: ({ filePath, bytes }: { filePath: FilePathMatcher; bytes: Uint8Array }): void => {
      mock.calledWith([filePath]).resolves(bytes);
    },
    throws: ({ filePath, error }: { filePath: FilePathMatcher; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
