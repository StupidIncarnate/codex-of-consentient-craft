import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const workspaceDiscoverLayerReadBrokerProxy = (): {
  setupReturnsPackage: (params: { name: string }) => void;
  setupThrows: () => void;
  setupReturnsNoName: () => void;
} => {
  const readProxy = fsReadFileAdapterProxy();

  return {
    setupReturnsPackage: ({ name }: { name: string }): void => {
      readProxy.returns({ content: JSON.stringify({ name }) });
    },

    setupThrows: (): void => {
      readProxy.throws({ error: new Error('ENOENT') });
    },

    setupReturnsNoName: (): void => {
      readProxy.returns({ content: JSON.stringify({ version: '1.0.0' }) });
    },
  };
};
