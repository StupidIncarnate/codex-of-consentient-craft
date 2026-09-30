import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const matchCandidatesLayerBrokerProxy = (): {
  setupCandidateFile: (params: { questFilePath: string; contents: string }) => void;
  setupCandidateFileOnce: (params: { questFilePath: string; contents: string }) => void;
  setupUnreadableCandidateFile: (params: { questFilePath: string }) => void;
} => {
  const readFileChild = readFileProxy();

  return {
    setupCandidateFile: ({
      questFilePath,
      contents,
    }: {
      questFilePath: string;
      contents: string;
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
      questFilePath: string;
      contents: string;
    }): void => {
      readFileChild.returnsOnce({ path: questFilePath, contents });
    },

    setupUnreadableCandidateFile: ({ questFilePath }: { questFilePath: string }): void => {
      readFileChild.denied({ path: questFilePath });
    },
  };
};
