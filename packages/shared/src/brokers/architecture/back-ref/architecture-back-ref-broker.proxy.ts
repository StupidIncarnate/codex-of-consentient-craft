import { architectureSourceReadBrokerProxy } from '../source-read/architecture-source-read-broker.proxy';

export const architectureBackRefBrokerProxy = (): {
  setupSource: ({ filePath, content }: { filePath: string; content: string }) => void;
  setupMissing: ({ filePath }: { filePath: string }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: string) => string }) => void;
} => {
  const sourceProxy = architectureSourceReadBrokerProxy();
  return {
    setupSource: ({ filePath, content }: { filePath: string; content: string }): void => {
      sourceProxy.setupReturns({ filePath, content });
    },
    setupMissing: ({ filePath }: { filePath: string }): void => {
      sourceProxy.setupMissing({ filePath });
    },
    setupImplementation: ({ fn }: { fn: (filePath: string) => string }): void => {
      sourceProxy.setupImplementation({ fn });
    },
  };
};
