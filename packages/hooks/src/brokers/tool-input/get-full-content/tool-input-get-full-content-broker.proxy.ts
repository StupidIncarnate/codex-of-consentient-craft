import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

export const toolInputGetFullContentBrokerProxy = (): {
  setupReadFileSuccess: ({ contents }: { contents: FileContents }) => void;
  setupReadFileNotFound: () => void;
  setupReadFileError: ({ error }: { error: Error }) => void;
} => {
  const fsProxy = fsReadFileAdapterProxy();

  return {
    setupReadFileSuccess: ({ contents }) => {
      fsProxy.returns({ contents });
    },

    setupReadFileNotFound: () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      fsProxy.throws({ error });
    },

    setupReadFileError: ({ error }) => {
      fsProxy.throws({ error });
    },
  };
};
