import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fileReadOrEmptyBrokerProxy = (): {
  setupFileExists: ({ filePath, content }: { filePath: FilePath; content: string }) => void;
  setupFileNotFound: ({ filePath }: { filePath: FilePath }) => void;
  setupFileError: ({ filePath, error }: { filePath: FilePath; error: Error }) => void;
} => {
  const fsProxy = fsReadFileAdapterProxy();

  return {
    setupFileExists: ({ filePath, content }: { filePath: FilePath; content: string }) => {
      fsProxy.returns({ filePath, contents: FileContentsStub({ value: content }) });
    },
    setupFileNotFound: ({ filePath }: { filePath: FilePath }) => {
      const enoentError = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      fsProxy.throws({ filePath, error: enoentError });
    },
    setupFileError: ({ filePath, error }: { filePath: FilePath; error: Error }) => {
      fsProxy.throws({ filePath, error });
    },
  };
};
