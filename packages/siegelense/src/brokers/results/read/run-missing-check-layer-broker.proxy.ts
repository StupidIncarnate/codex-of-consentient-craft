import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const runMissingCheckLayerBrokerProxy = (): {
  setupStoredReturn: (params: { storedReturnPath: AbsoluteFilePath; content: string }) => void;
  setupMissingStoredReturn: (params: { storedReturnPath: AbsoluteFilePath }) => void;
  setupTranscript: (params: { transcriptPath: AbsoluteFilePath; content: string }) => void;
  setupMissingTranscript: (params: { transcriptPath: AbsoluteFilePath }) => void;
} => {
  const readFileProxy = readFileIfExistsProxy();

  return {
    setupStoredReturn: ({
      storedReturnPath,
      content,
    }: {
      storedReturnPath: AbsoluteFilePath;
      content: string;
    }): void => {
      readFileProxy.returns({ path: storedReturnPath, contents: content });
    },

    setupMissingStoredReturn: ({
      storedReturnPath,
    }: {
      storedReturnPath: AbsoluteFilePath;
    }): void => {
      readFileProxy.missing({ path: storedReturnPath });
    },

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
