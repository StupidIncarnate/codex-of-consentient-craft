import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

// fs-write-file-adapter.proxy.ts mocks this same npm `writeFile`, keyed on the path alone (one
// argument). Matching only on `filePath` here would collide with that registration at equal
// specificity, so every call below is described with the full three-argument shape — path,
// content (any value), and the literal 'base64' encoding — which is strictly more specific and
// wins the match for base64 writes without touching the other proxy's utf8 writes.
type FilePathMatcher = AbsoluteFilePath | ((value: unknown) => boolean);

export const fsWriteFileBase64AdapterProxy = (): {
  succeeds: (params: { filePath: FilePathMatcher }) => void;
  throws: (params: { filePath: FilePathMatcher; error: Error }) => void;
  writtenArgsFor: (params: { filePath: AbsoluteFilePath }) => unknown[] | undefined;
} => {
  const mock = registerMock({ fn: writeFile });

  return {
    succeeds: ({ filePath }: { filePath: FilePathMatcher }): void => {
      mock
        .calledWith([
          filePath,
          (): boolean => true,
          (encoding: unknown): boolean => encoding === 'base64',
        ])
        .resolves(undefined);
    },
    throws: ({ filePath, error }: { filePath: FilePathMatcher; error: Error }): void => {
      mock
        .calledWith([
          filePath,
          (): boolean => true,
          (encoding: unknown): boolean => encoding === 'base64',
        ])
        .rejects(error);
    },
    writtenArgsFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown[] | undefined =>
      mock.callsMatching([filePath]).at(-1),
  };
};
