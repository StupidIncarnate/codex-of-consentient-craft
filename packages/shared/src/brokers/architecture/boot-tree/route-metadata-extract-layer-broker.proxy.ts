import { readFileContentsLayerBrokerProxy } from './read-file-contents-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const routeMetadataExtractLayerBrokerProxy = (): {
  setupSource: ({
    flowFile,
    content,
  }: {
    flowFile: AbsoluteFilePath;
    content: ContentText;
  }) => void;
  setupMissing: ({ flowFile }: { flowFile: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const fileProxy = readFileContentsLayerBrokerProxy();

  return {
    setupSource: ({
      flowFile,
      content,
    }: {
      flowFile: AbsoluteFilePath;
      content: ContentText;
    }): void => {
      fileProxy.setupReturns({ filePath: flowFile, content });
    },
    setupMissing: ({ flowFile }: { flowFile: AbsoluteFilePath }): void => {
      fileProxy.setupMissing({ filePath: flowFile });
    },
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      fileProxy.setupImplementation({ fn });
    },
  };
};
