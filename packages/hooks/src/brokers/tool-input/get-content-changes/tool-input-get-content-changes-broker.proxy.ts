import { fileReadOrEmptyBrokerProxy } from '../../file/read-or-empty/file-read-or-empty-broker.proxy';
import { toolInputGetFullContentBrokerProxy } from '../get-full-content/tool-input-get-full-content-broker.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const toolInputGetContentChangesBrokerProxy = (): {
  setupReadFileSuccess: ({ filePath, content }: { filePath: FilePath; content: string }) => void;
  setupReadFileNotFound: ({ filePath }: { filePath: FilePath }) => void;
  setupReadFileError: ({ filePath, error }: { filePath: FilePath; error: Error }) => void;
} => {
  const fileReadProxy = fileReadOrEmptyBrokerProxy();
  toolInputGetFullContentBrokerProxy();

  return {
    // The broker reads the SAME filePath twice (once for oldContent, once inside
    // toolInputGetFullContentBroker); calledWith staging is persistent (not one-shot), so
    // addressing it once by filePath satisfies both reads.
    setupReadFileSuccess: ({ filePath, content }) => {
      fileReadProxy.setupFileExists({ filePath, content });
    },

    setupReadFileNotFound: ({ filePath }) => {
      fileReadProxy.setupFileNotFound({ filePath });
    },

    setupReadFileError: ({ filePath, error }) => {
      fileReadProxy.setupFileError({ filePath, error });
    },
  };
};
