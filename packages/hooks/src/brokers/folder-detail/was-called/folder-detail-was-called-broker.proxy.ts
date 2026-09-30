import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const folderDetailWasCalledBrokerProxy = (): {
  setupTranscript: ({
    transcriptFilePath,
    contents,
  }: {
    transcriptFilePath: string;
    contents: string;
  }) => void;
  setupReadError: ({ transcriptFilePath }: { transcriptFilePath: string }) => void;
} => {
  const fsProxy = readFileProxy();

  return {
    setupTranscript: ({
      transcriptFilePath,
      contents,
    }: {
      transcriptFilePath: string;
      contents: string;
    }): void => {
      fsProxy.returns({
        path: transcriptFilePath,
        contents,
      });
    },
    setupReadError: ({ transcriptFilePath }: { transcriptFilePath: string }): void => {
      fsProxy.throwsMatchingPath({
        path: transcriptFilePath,
        error: Object.assign(new Error('read failed'), { code: 'EACCES' }),
      });
    },
  };
};
