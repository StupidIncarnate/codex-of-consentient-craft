import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';

export const fileReadOrEmptyBrokerProxy = (): {
  setupFileExists: ({ filePath, content }: { filePath: string; content: string }) => void;
  setupFileNotFound: ({ filePath }: { filePath: string }) => void;
  setupFileError: ({ filePath, error }: { filePath: string; error: Error }) => void;
} => {
  const fsProxy = readFileProxy();
  isFsErrorProxy();

  return {
    setupFileExists: ({ filePath, content }: { filePath: string; content: string }): void => {
      fsProxy.returns({ path: filePath, contents: content });
    },
    setupFileNotFound: ({ filePath }: { filePath: string }): void => {
      fsProxy.missing({ path: filePath });
    },
    setupFileError: ({ filePath, error }: { filePath: string; error: Error }): void => {
      fsProxy.throwsMatchingPath({
        path: filePath,
        error: Object.assign(error, {
          code: (error as NodeJS.ErrnoException).code ?? 'EACCES',
        }),
      });
    },
  };
};
