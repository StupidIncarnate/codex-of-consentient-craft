import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirDirsAdapterProxy } from '../../../adapters/fs/readdir-dirs/fs-readdir-dirs-adapter.proxy';

export const workspaceDiscoverLayerReadBrokerProxy = (): {
  setupReturnsPackage: (params: { name: string }) => void;
  setupReturnsPackageNoSrc: (params: { name: string }) => void;
  setupThrows: () => void;
  setupReturnsNoName: () => void;
  getStderrOutput: () => jest.Mock;
} => {
  const readProxy = fsReadFileAdapterProxy();
  const readdirProxy = fsReaddirDirsAdapterProxy();

  const stderrMock = jest
    .spyOn(process.stderr, 'write')
    .mockReturnValue(true) as unknown as jest.Mock;

  return {
    getStderrOutput: (): jest.Mock => stderrMock,

    setupReturnsPackage: ({ name }: { name: string }): void => {
      readProxy.returns({ content: JSON.stringify({ name }) });
      readdirProxy.returns({ dirs: ['src'] });
    },

    setupReturnsPackageNoSrc: ({ name }: { name: string }): void => {
      readProxy.returns({ content: JSON.stringify({ name }) });
      readdirProxy.returns({ dirs: ['define', 'docs'] });
    },

    setupThrows: (): void => {
      readProxy.throws({ error: new Error('ENOENT') });
    },

    setupReturnsNoName: (): void => {
      readProxy.returns({ content: JSON.stringify({ version: '1.0.0' }) });
    },
  };
};
