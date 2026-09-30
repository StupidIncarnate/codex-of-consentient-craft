import { readFileContentsLayerBrokerProxy } from './read-file-contents-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const routeMetadataExtractLayerBrokerProxy = (): {
  setupSource: ({
    flowFile,
    content,
  }: {
    flowFile: string;
    content: ContentText;
  }) => void;
  setupMissing: ({ flowFile }: { flowFile: string }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const fileProxy = readFileContentsLayerBrokerProxy();

  return {
    setupSource: ({
      flowFile,
      content,
    }: {
      flowFile: string;
      content: ContentText;
    }): void => {
      fileProxy.setupReturns({ filePath: flowFile, content });
    },
    setupMissing: ({ flowFile }: { flowFile: string }): void => {
      fileProxy.setupMissing({ filePath: flowFile });
    },
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      fileProxy.setupImplementation({ fn });
    },
  };
};
