import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
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
  const fsProxy = fsReadFileAdapterProxy();

  return {
    setupTranscript: ({
      transcriptFilePath,
      contents,
    }: {
      transcriptFilePath: FilePath;
      contents: string;
    }): void => {
      fsProxy.returns({
        filePath: transcriptFilePath,
        contents: FileContentsStub({ value: contents }),
      });
    },
    setupReadError: ({ transcriptFilePath }: { transcriptFilePath: FilePath }): void => {
      fsProxy.throws({ filePath: transcriptFilePath, error: new Error('read failed') });
    },
  };
};
