import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const runMissingCheckLayerBrokerProxy = (): {
  setupStoredReturn: (params: { storedReturnPath: AbsoluteFilePath; content: string }) => void;
  setupMissingStoredReturn: (params: { storedReturnPath: AbsoluteFilePath }) => void;
  setupTranscript: (params: { transcriptPath: AbsoluteFilePath; content: string }) => void;
  setupMissingTranscript: (params: { transcriptPath: AbsoluteFilePath }) => void;
} => {
  errorIsNativeErrorAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupStoredReturn: ({
      storedReturnPath,
      content,
    }: {
      storedReturnPath: AbsoluteFilePath;
      content: string;
    }): void => {
      readFileProxy.resolves({ filePath: storedReturnPath, content });
    },

    setupMissingStoredReturn: ({
      storedReturnPath,
    }: {
      storedReturnPath: AbsoluteFilePath;
    }): void => {
      readFileProxy.rejects({
        filePath: storedReturnPath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    setupTranscript: ({
      transcriptPath,
      content,
    }: {
      transcriptPath: AbsoluteFilePath;
      content: string;
    }): void => {
      readFileProxy.resolves({ filePath: transcriptPath, content });
    },

    setupMissingTranscript: ({ transcriptPath }: { transcriptPath: AbsoluteFilePath }): void => {
      readFileProxy.rejects({
        filePath: transcriptPath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },
  };
};
