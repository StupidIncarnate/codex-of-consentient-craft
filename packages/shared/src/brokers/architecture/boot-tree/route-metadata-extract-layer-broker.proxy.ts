import { readFileContentsLayerBrokerProxy } from './read-file-contents-layer-broker.proxy';

export const routeMetadataExtractLayerBrokerProxy = (): {
  setupSource: ({
    flowFile,
    content,
  }: {
    flowFile: string;
    content: string;
  }) => void;
  setupMissing: ({ flowFile }: { flowFile: string }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: string) => string }) => void;
} => {
  const fileProxy = readFileContentsLayerBrokerProxy();

  return {
    setupSource: ({
      flowFile,
      content,
    }: {
      flowFile: string;
      content: string;
    }): void => {
      fileProxy.setupReturns({ filePath: flowFile, content });
    },
    setupMissing: ({ flowFile }: { flowFile: string }): void => {
      fileProxy.setupMissing({ filePath: flowFile });
    },
    setupImplementation: ({ fn }: { fn: (filePath: string) => string }): void => {
      fileProxy.setupImplementation({ fn });
    },
  };
};
