import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const matchCandidatesLayerBrokerProxy = (): {
  setupCandidateFile: (params: { questFilePath: FilePath; contents: FileContents }) => void;
  setupCandidateFileOnce: (params: { questFilePath: FilePath; contents: FileContents }) => void;
  setupUnreadableCandidateFile: (params: { questFilePath: FilePath }) => void;
} => {
  const readFileChild = readFileProxy();

  return {
    setupCandidateFile: ({
      questFilePath,
      contents,
    }: {
      questFilePath: FilePath;
      contents: FileContents;
    }): void => {
      readFileChild.returns({ path: questFilePath, contents });
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
      readFileChild.returnsOnce({ path: questFilePath, contents });
    },

    setupUnreadableCandidateFile: ({ questFilePath }: { questFilePath: FilePath }): void => {
      readFileChild.denied({ path: questFilePath });
    },
  };
};
