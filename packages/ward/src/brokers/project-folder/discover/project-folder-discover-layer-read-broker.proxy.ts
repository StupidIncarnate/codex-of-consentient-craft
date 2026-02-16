import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const projectFolderDiscoverLayerReadBrokerProxy = (): {
  setupReturnsContent: (params: { content: string }) => void;
  setupThrows: () => void;
} => {
  const readProxy = fsReadFileAdapterProxy();

  return {
    setupReturnsContent: ({ content }: { content: string }): void => {
      readProxy.returns({ content });
    },

    setupThrows: (): void => {
      readProxy.throws({ error: new Error('ENOENT') });
    },
  };
};
