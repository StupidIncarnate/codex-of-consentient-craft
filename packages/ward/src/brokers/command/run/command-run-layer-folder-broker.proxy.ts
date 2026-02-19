import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const commandRunLayerFolderBrokerProxy = (): {
  setupReturnsPackage: (params: { name: string }) => void;
  setupReturnsContent: (params: { content: string }) => void;
  setupThrows: () => void;
} => {
  const readProxy = fsReadFileAdapterProxy();

  return {
    setupReturnsPackage: ({ name }: { name: string }): void => {
      readProxy.returns({ content: JSON.stringify({ name }) });
    },
    setupReturnsContent: ({ content }: { content: string }): void => {
      readProxy.returns({ content });
    },
    setupThrows: (): void => {
      readProxy.throws({ error: new Error('ENOENT') });
    },
  };
};
