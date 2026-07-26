import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

// Some callers (e.g. designScaffoldBroker) compute the write path from arguments the proxy
// never receives, so callers may key on either a literal path or a predicate.
type FilePathMatcher = AbsoluteFilePath | ((value: unknown) => boolean);

export const fsWriteFileAdapterProxy = (): {
  succeeds: (params: { filePath: FilePathMatcher }) => void;
  throws: (params: { filePath: FilePathMatcher; error: Error }) => void;
} => {
  const mock = registerMock({ fn: writeFile });

  return {
    succeeds: ({ filePath }: { filePath: FilePathMatcher }): void => {
      mock.calledWith([filePath]).resolves({ success: true as const });
    },
    throws: ({ filePath, error }: { filePath: FilePathMatcher; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
