import { AbsoluteFilePathStub, filePathContract } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const commandRunLayerFolderBrokerProxy = (): {
  setupReturnsPackage: (params: { name: string }) => void;
  setupReturnsContent: (params: { content: string }) => void;
  setupThrows: () => void;
} => {
  const readProxy = fsReadFileAdapterProxy();

  // Every caller of this proxy (command-run-layer-folder-broker.test.ts and
  // command-run-broker.proxy.ts) resolves the package.json for rootPath '/project'.
  const filePath = filePathContract.parse(
    `${AbsoluteFilePathStub({ value: '/project' })}/package.json`,
  );

  return {
    setupReturnsPackage: ({ name }: { name: string }): void => {
      readProxy.returns({ filePath, content: JSON.stringify({ name }) });
    },
    setupReturnsContent: ({ content }: { content: string }): void => {
      readProxy.returns({ filePath, content });
    },
    setupThrows: (): void => {
      readProxy.throws({ filePath, error: new Error('ENOENT') });
    },
  };
};
