import { architectureSourceReadBrokerProxy } from '../source-read/architecture-source-read-broker.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

export const architectureOrchestratorMethodExtractBrokerProxy = (): {
  setupFiles: (fileMap: Record<string, string>) => void;
} => {
  const readProxy = architectureSourceReadBrokerProxy();

  return {
    setupFiles: (fileMap: Record<string, string>): void => {
      readProxy.setupImplementation({
        fn: (filePath) => {
          const content = fileMap[String(filePath)];
          if (content === undefined) throw FileMissingErrorStub({ path: String(filePath) });
          return content;
        },
      });
    },
  };
};
