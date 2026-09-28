import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fileReadOrEmptyBrokerProxy = (): {
  setupFileExists: ({ filePath, content }: { filePath: FilePath; content: string }) => void;
  setupFileNotFound: ({ filePath }: { filePath: FilePath }) => void;
  setupFileError: ({ filePath, error }: { filePath: FilePath; error: Error }) => void;
} => {
  const fsProxy = readFileProxy();

  return {
    setupFileExists: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      fsProxy.returns({ path: filePath, contents: content });
    },
    setupFileNotFound: ({ filePath }: { filePath: FilePath }): void => {
      fsProxy.missing({ path: filePath });
    },
    setupFileError: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      fsProxy.throwsMatchingPath({
        path: filePath,
        error: Object.assign(error, {
          code: (error as NodeJS.ErrnoException).code ?? 'EACCES',
        }),
      });
    },
  };
};
