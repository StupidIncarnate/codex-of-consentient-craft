import { architectureSourceReadBrokerProxy } from '../source-read/architecture-source-read-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

export const architectureOrchestratorMethodExtractBrokerProxy = (): {
  setupFiles: (fileMap: Record<string, string>) => void;
} => {
  const readProxy = architectureSourceReadBrokerProxy();

  return {
    setupFiles: (fileMap: Record<string, string>): void => {
      readProxy.setupImplementation({
        fn: (filePath) => {
          const content = fileMap[String(filePath)];
          if (content === undefined) throw new Error(`file not found: ${String(filePath)}`);
          return ContentTextStub({ value: content });
        },
      });
    },
  };
};
