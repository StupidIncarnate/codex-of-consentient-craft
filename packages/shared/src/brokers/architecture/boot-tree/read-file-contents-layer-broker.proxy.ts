import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const readFileContentsLayerBrokerProxy = (): {
  setupReturns: ({ filePath, content }: { filePath: string; content: string }) => void;
  setupMissing: ({ filePath }: { filePath: string }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: string) => string }) => void;
} => {
  const gatewayProxy = readFileSyncProxy();

  return {
    setupReturns: ({ filePath, content }: { filePath: string; content: string }): void => {
      gatewayProxy.returns({ path: filePath, contents: content });
    },

    setupMissing: ({ filePath }: { filePath: string }): void => {
      gatewayProxy.throws({ path: filePath, error: FileMissingErrorStub({ path: filePath }) });
    },

    setupImplementation: ({ fn }: { fn: (filePath: string) => string }): void => {
      gatewayProxy.implementsMatchingPath({
        path: isAbsolutePath,
        fn: (path) => fn(path),
      });
    },
  };
};
