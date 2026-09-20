import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const transcriptReadLayerBrokerProxy = (): {
  setupTranscript: (params: { transcriptPath: AbsoluteFilePath; content: string }) => void;
  setupMissingTranscript: (params: { transcriptPath: AbsoluteFilePath }) => void;
} => {
  errorIsNativeErrorAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
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
