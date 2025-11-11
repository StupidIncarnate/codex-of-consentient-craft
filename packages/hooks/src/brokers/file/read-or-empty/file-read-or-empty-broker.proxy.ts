import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

export const fileReadOrEmptyBrokerProxy = (): {
  setupFileExists: ({ content }: { content: string }) => void;
  setupFileNotFound: () => void;
  setupFileError: ({ error }: { error: Error }) => void;
} => {
  const fsProxy = fsReadFileAdapterProxy();

  return {
    setupFileExists: ({ content }: { content: string }) => {
      fsProxy.returns({ contents: FileContentsStub({ value: content }) });
    },
    setupFileNotFound: () => {
      const enoentError = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      fsProxy.throws({ error: enoentError });
    },
    setupFileError: ({ error }: { error: Error }) => {
      fsProxy.throws({ error });
    },
  };
};
