import { architectureSourceReadBrokerProxy } from '../source-read/architecture-source-read-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureBackRefBrokerProxy = (): {
  setupSource: ({
    filePath,
    content,
  }: {
    filePath: AbsoluteFilePath;
    content: ContentText;
  }) => void;
  setupMissing: ({ filePath }: { filePath: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const sourceProxy = architectureSourceReadBrokerProxy();
  return {
    setupSource: ({
      filePath,
      content,
    }: {
      filePath: AbsoluteFilePath;
      content: ContentText;
    }): void => {
      sourceProxy.setupReturns({ filePath, content });
    },
    setupMissing: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      sourceProxy.setupMissing({ filePath });
    },
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      sourceProxy.setupImplementation({ fn });
    },
  };
};
