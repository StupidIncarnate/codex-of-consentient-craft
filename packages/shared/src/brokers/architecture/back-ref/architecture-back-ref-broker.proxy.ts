import { architectureSourceReadBrokerProxy } from '../source-read/architecture-source-read-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureBackRefBrokerProxy = (): {
  setupSource: ({
    filePath,
    content,
  }: {
    filePath: string;
    content: ContentText;
  }) => void;
  setupMissing: ({ filePath }: { filePath: string }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const sourceProxy = architectureSourceReadBrokerProxy();
  return {
    setupSource: ({
      filePath,
      content,
    }: {
      filePath: string;
      content: ContentText;
    }): void => {
      sourceProxy.setupReturns({ filePath, content });
    },
    setupMissing: ({ filePath }: { filePath: string }): void => {
      sourceProxy.setupMissing({ filePath });
    },
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      sourceProxy.setupImplementation({ fn });
    },
  };
};
