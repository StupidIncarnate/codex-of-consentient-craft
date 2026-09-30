import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const runMissingCheckLayerBrokerProxy = (): {
  setupStoredReturn: (params: { storedReturnPath: string; content: string }) => void;
  setupMissingStoredReturn: (params: { storedReturnPath: string }) => void;
  setupTranscript: (params: { transcriptPath: string; content: string }) => void;
  setupMissingTranscript: (params: { transcriptPath: string }) => void;
} => {
  const readFileProxy = readFileIfExistsProxy();

  return {
    setupStoredReturn: ({
      storedReturnPath,
      content,
    }: {
      storedReturnPath: string;
      content: string;
    }): void => {
      readFileProxy.returns({ path: storedReturnPath, contents: content });
    },

    setupMissingStoredReturn: ({ storedReturnPath }: { storedReturnPath: string }): void => {
      readFileProxy.missing({ path: storedReturnPath });
    },

    setupTranscript: ({
      transcriptPath,
      content,
    }: {
      transcriptPath: string;
      content: string;
    }): void => {
      readFileProxy.returns({ path: transcriptPath, contents: content });
    },

    setupMissingTranscript: ({ transcriptPath }: { transcriptPath: string }): void => {
      readFileProxy.missing({ path: transcriptPath });
    },
  };
};
