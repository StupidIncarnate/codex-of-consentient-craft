import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const matchCandidatesLayerBrokerProxy = (): {
  setupCandidateFile: (params: { questFilePath: FilePath; contents: FileContents }) => void;
  setupCandidateFileOnce: (params: { questFilePath: FilePath; contents: FileContents }) => void;
  setupUnreadableCandidateFile: (params: { questFilePath: FilePath; error: Error }) => void;
} => {
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupCandidateFile: ({
      questFilePath,
      contents,
    }: {
      questFilePath: FilePath;
      contents: FileContents;
    }): void => {
      readFileProxy.resolves({ filePath: questFilePath, content: contents });
    },

    // Queues ONE addressed read of this path instead of answering every read of it. A parent
    // staging two generations of the same quest file needs each generation consumed in turn; a
    // sticky staging would let the later one answer reads that have not happened yet.
    setupCandidateFileOnce: ({
      questFilePath,
      contents,
    }: {
      questFilePath: FilePath;
      contents: FileContents;
    }): void => {
      readFileProxy.resolvesOnceFor({ filePath: questFilePath, content: contents });
    },

    setupUnreadableCandidateFile: ({
      questFilePath,
      error,
    }: {
      questFilePath: FilePath;
      error: Error;
    }): void => {
      readFileProxy.rejects({ filePath: questFilePath, error });
    },
  };
};
