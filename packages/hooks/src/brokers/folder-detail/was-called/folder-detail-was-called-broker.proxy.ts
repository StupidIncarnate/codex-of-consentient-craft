import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const folderDetailWasCalledBrokerProxy = (): {
  setupTranscript: ({
    transcriptFilePath,
    contents,
  }: {
    transcriptFilePath: FilePath;
    contents: string;
  }) => void;
  setupReadError: ({ transcriptFilePath }: { transcriptFilePath: FilePath }) => void;
} => {
  const fsProxy = readFileProxy();

  return {
    setupTranscript: ({
      transcriptFilePath,
      contents,
    }: {
      transcriptFilePath: FilePath;
      contents: string;
    }): void => {
      fsProxy.returns({
        path: transcriptFilePath,
        contents,
      });
    },
    setupReadError: ({ transcriptFilePath }: { transcriptFilePath: FilePath }): void => {
      fsProxy.throwsMatchingPath({
        path: transcriptFilePath,
        error: Object.assign(new Error('read failed'), { code: 'EACCES' }),
      });
    },
  };
};
