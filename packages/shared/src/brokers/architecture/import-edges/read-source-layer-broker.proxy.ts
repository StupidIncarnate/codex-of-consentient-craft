import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const readSourceLayerBrokerProxy = (): {
  returns: ({ filePath, content }: { filePath: string; content: string }) => void;
  throws: ({ filePath, error }: { filePath: string; error: Error }) => void;
  implementation: ({ fn }: { fn: (filePath: string) => string }) => void;
} => {
  const gatewayProxy = readFileSyncProxy();

  return {
    returns: ({ filePath, content }: { filePath: string; content: string }): void => {
      gatewayProxy.returns({ path: filePath, contents: content });
    },

    throws: ({ filePath, error }: { filePath: string; error: Error }): void => {
      gatewayProxy.throws({ path: filePath, error });
    },

    implementation: ({ fn }: { fn: (filePath: string) => string }): void => {
      gatewayProxy.implementsMatchingPath({
        path: isAbsolutePath,
        fn: (path) => fn(path),
      });
    },
  };
};
