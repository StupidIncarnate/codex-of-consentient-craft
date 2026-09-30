import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

export const toolInputGetFullContentBrokerProxy = (): {
  setupReadFileSuccess: ({
    filePath,
    contents,
  }: {
    filePath: string;
    contents: FileContents;
  }) => void;
  setupReadFileNotFound: ({ filePath }: { filePath: string }) => void;
  setupReadFileError: ({ filePath, error }: { filePath: string; error: Error }) => void;
} => {
  const fsProxy = readFileProxy();
  isFsErrorProxy();

  return {
    setupReadFileSuccess: ({ filePath, contents }): void => {
      fsProxy.returns({ path: filePath, contents });
    },

    setupReadFileNotFound: ({ filePath }): void => {
      fsProxy.missing({ path: filePath });
    },

    setupReadFileError: ({ filePath, error }): void => {
      fsProxy.throwsMatchingPath({
        path: filePath,
        error: Object.assign(error, {
          code: (error as NodeJS.ErrnoException).code ?? 'EACCES',
        }),
      });
    },
  };
};
