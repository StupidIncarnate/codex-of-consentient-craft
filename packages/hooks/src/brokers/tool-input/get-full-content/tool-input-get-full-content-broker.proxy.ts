import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const toolInputGetFullContentBrokerProxy = (): {
  setupReadFileSuccess: ({
    filePath,
    contents,
  }: {
    filePath: FilePath;
    contents: FileContents;
  }) => void;
  setupReadFileNotFound: ({ filePath }: { filePath: FilePath }) => void;
  setupReadFileError: ({ filePath, error }: { filePath: FilePath; error: Error }) => void;
} => {
  const fsProxy = fsReadFileAdapterProxy();

  return {
    setupReadFileSuccess: ({ filePath, contents }) => {
      fsProxy.returns({ filePath, contents });
    },

    setupReadFileNotFound: ({ filePath }) => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      fsProxy.throws({ filePath, error });
    },

    setupReadFileError: ({ filePath, error }) => {
      fsProxy.throws({ filePath, error });
    },
  };
};
