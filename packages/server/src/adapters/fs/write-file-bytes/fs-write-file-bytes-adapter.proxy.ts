import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

// fs-write-file-adapter.proxy.ts and fs-write-file-base64-adapter.proxy.ts mock this same npm
// `writeFile`, each keyed on the path plus its own extra encoding-shaped matcher. This adapter
// passes no encoding argument, so a bare path address is already more specific than neither of
// those needs to disambiguate against — and every destination the caller writes to carries a
// freshly minted uuid, so a bare path here never lands on a path either of those proxies stages.
type FilePathMatcher = AbsoluteFilePath | ((value: unknown) => boolean);

export const fsWriteFileBytesAdapterProxy = (): {
  succeeds: (params: { filePath: FilePathMatcher }) => void;
  throws: (params: { filePath: FilePathMatcher; error: Error }) => void;
  writtenArgsFor: (params: { filePath: AbsoluteFilePath }) => unknown[] | undefined;
} => {
  const mock = registerMock({ fn: writeFile });

  return {
    succeeds: ({ filePath }: { filePath: FilePathMatcher }): void => {
      mock.calledWith([filePath]).resolves(undefined);
    },
    throws: ({ filePath, error }: { filePath: FilePathMatcher; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
    writtenArgsFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown[] | undefined =>
      mock.callsMatching([filePath]).at(-1),
  };
};
