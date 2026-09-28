import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const readFirstExistingCandidateLayerBrokerProxy = (): {
  setupFile: (params: { filePath: FilePath; content: string }) => void;
  setupMissing: (params: { filePath: FilePath }) => void;
  setupPermissionDenied: (params: { filePath: FilePath }) => void;
} => {
  const fsProxy = readFileProxy();

  return {
    setupFile: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      fsProxy.returns({ path: filePath, contents: content });
    },
    setupMissing: ({ filePath }: { filePath: FilePath }): void => {
      fsProxy.missing({ path: filePath });
    },
    setupPermissionDenied: ({ filePath }: { filePath: FilePath }): void => {
      fsProxy.denied({ path: filePath });
    },
  };
};
