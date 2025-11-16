import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

export const configFileLoadBrokerProxy = (): {
  setupValidConfig: (params: { config: Record<string, unknown> }) => void;
  setupInvalidJson: () => void;
  setupFileNotFound: () => void;
} => {
  const fsProxy = fsReadFileAdapterProxy();

  return {
    setupValidConfig: ({ config }: { config: Record<string, unknown> }) => {
      fsProxy.returns({ contents: FileContentsStub({ value: JSON.stringify(config) }) });
    },

    setupInvalidJson: () => {
      fsProxy.returns({ contents: FileContentsStub({ value: '{ invalid json }' }) });
    },

    setupFileNotFound: () => {
      fsProxy.throws({ error: new Error('ENOENT: no such file or directory') });
    },
  };
};
