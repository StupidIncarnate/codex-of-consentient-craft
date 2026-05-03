import { architectureSourceReadBrokerProxy } from '../source-read/architecture-source-read-broker.proxy';
import { architectureOrchestratorMethodExtractBrokerProxy } from '../orchestrator-method-extract/architecture-orchestrator-method-extract-broker.proxy';
import { architectureBackRefBrokerProxy } from '../back-ref/architecture-back-ref-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

export const architectureBindingFlowTraceBrokerProxy = (): {
  setupFiles: (fileMap: Record<string, string>) => void;
} => {
  const readProxy = architectureSourceReadBrokerProxy();
  architectureOrchestratorMethodExtractBrokerProxy();
  architectureBackRefBrokerProxy();

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
