import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { AbsoluteFilePathStub, filePathContract } from '@dungeonmaster/shared/contracts';

export const folderResolveLayerBrokerProxy = (): {
  setupReturnsPackage: (params: { name: string }) => void;
  setupReturnsContent: (params: { content: string }) => void;
  setupThrows: () => void;
} => {
  const readProxy = readFileProxy();

  // Every caller of this proxy (folder-resolve-layer-broker.test.ts and
  // command-run-broker.proxy.ts) resolves the package.json for rootPath '/project'.
  const path = filePathContract.parse(
    `${AbsoluteFilePathStub({ value: '/project' })}/package.json`,
  );

  return {
    setupReturnsPackage: ({ name }: { name: string }): void => {
      readProxy.returns({ path, contents: JSON.stringify({ name }) });
    },
    setupReturnsContent: ({ content }: { content: string }): void => {
      readProxy.returns({ path, contents: content });
    },
    setupThrows: (): void => {
      readProxy.missing({ path });
    },
  };
};
