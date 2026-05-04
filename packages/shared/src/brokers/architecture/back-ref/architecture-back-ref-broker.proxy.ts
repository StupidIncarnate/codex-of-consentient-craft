import { architectureSourceReadBrokerProxy } from '../source-read/architecture-source-read-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureBackRefBrokerProxy = (): {
  setupSource: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const sourceProxy = architectureSourceReadBrokerProxy();
  return {
    setupSource: ({ content }: { content: ContentText }): void => {
      sourceProxy.setupReturns({ content });
    },
    setupMissing: (): void => {
      sourceProxy.setupMissing();
    },
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      sourceProxy.setupImplementation({ fn });
    },
  };
};
