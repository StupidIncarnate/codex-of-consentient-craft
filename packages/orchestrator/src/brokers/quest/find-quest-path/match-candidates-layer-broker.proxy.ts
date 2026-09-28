import { readFile } from 'fs/promises';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const matchCandidatesLayerBrokerProxy = (): {
  setupCandidateFile: (params: { questFilePath: FilePath; contents: FileContents }) => void;
  setupCandidateFileOnce: (params: { questFilePath: FilePath; contents: FileContents }) => void;
  setupUnreadableCandidateFile: (params: { questFilePath: FilePath; error: Error }) => void;
} => {
  // The gateway proxy is composed first, so the raw handle below shares its staging. It has no
  // addressed one-shot, and the gateway's `readFile` wrapper calls this same raw function.
  readFileProxy();
  const readFileHandle = registerMock({ fn: readFile });

  return {
    setupCandidateFile: ({
      questFilePath,
      contents,
    }: {
      questFilePath: FilePath;
      contents: FileContents;
    }): void => {
      readFileHandle.calledWith([questFilePath]).resolves(contents);
    },

    // Queues ONE addressed read of this path instead of answering every read of it. A parent
    // staging two generations of the same quest file needs each generation consumed in turn; a
    // sticky staging would let the later one answer reads that have not happened yet.
    setupCandidateFileOnce: ({
      questFilePath,
      contents,
    }: {
      questFilePath: FilePath;
      contents: FileContents;
    }): void => {
      readFileHandle.onceFor([questFilePath]).resolves(contents);
    },

    setupUnreadableCandidateFile: ({
      questFilePath,
      error,
    }: {
      questFilePath: FilePath;
      error: Error;
    }): void => {
      readFileHandle.calledWith([questFilePath]).rejects(error);
    },
  };
};
