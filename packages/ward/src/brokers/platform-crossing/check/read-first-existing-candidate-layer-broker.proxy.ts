import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const readFirstExistingCandidateLayerBrokerProxy = (): {
  setupFile: (params: { filePath: string; content: string }) => void;
  setupMissing: (params: { filePath: string }) => void;
  setupPermissionDenied: (params: { filePath: string }) => void;
} => {
  const fsProxy = readFileProxy();

  return {
    setupFile: ({ filePath, content }: { filePath: string; content: string }): void => {
      fsProxy.returns({ path: filePath, contents: content });
    },
    setupMissing: ({ filePath }: { filePath: string }): void => {
      fsProxy.missing({ path: filePath });
    },
    setupPermissionDenied: ({ filePath }: { filePath: string }): void => {
      fsProxy.denied({ path: filePath });
    },
  };
};
