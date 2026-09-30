import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const transcriptReadLayerBrokerProxy = (): {
  setupTranscript: (params: { transcriptPath: string; content: string }) => void;
  setupMissingTranscript: (params: { transcriptPath: string }) => void;
} => {
  const readFileProxy = readFileIfExistsProxy();

  return {
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
