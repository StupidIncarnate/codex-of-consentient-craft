import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const transcriptReadLayerBrokerProxy = (): {
  setupTranscript: (params: { transcriptPath: AbsoluteFilePath; content: string }) => void;
  setupMissingTranscript: (params: { transcriptPath: AbsoluteFilePath }) => void;
} => {
  const readFileProxy = readFileIfExistsProxy();

  return {
    setupTranscript: ({
      transcriptPath,
      content,
    }: {
      transcriptPath: AbsoluteFilePath;
      content: string;
    }): void => {
      readFileProxy.returns({ path: transcriptPath, contents: content });
    },

    setupMissingTranscript: ({ transcriptPath }: { transcriptPath: AbsoluteFilePath }): void => {
      readFileProxy.missing({ path: transcriptPath });
    },
  };
};
