import { fileReadOrEmptyBrokerProxy } from '../../file/read-or-empty/file-read-or-empty-broker.proxy';
import { toolInputGetFullContentBrokerProxy } from '../get-full-content/tool-input-get-full-content-broker.proxy';

export const toolInputGetContentChangesBrokerProxy = (): {
  setupReadFileSuccess: ({ content }: { content: string }) => void;
  setupReadFileNotFound: () => void;
  setupReadFileError: ({ error }: { error: Error }) => void;
} => {
  const fileReadProxy = fileReadOrEmptyBrokerProxy();
  toolInputGetFullContentBrokerProxy();

  return {
    setupReadFileSuccess: ({ content }) => {
      // File is read multiple times (old content + applying edits)
      // Set up mock to return same content consistently
      fileReadProxy.setupFileExists({ content });
      fileReadProxy.setupFileExists({ content });
    },

    setupReadFileNotFound: () => {
      fileReadProxy.setupFileNotFound();
    },

    setupReadFileError: ({ error }) => {
      fileReadProxy.setupFileError({ error });
    },
  };
};
