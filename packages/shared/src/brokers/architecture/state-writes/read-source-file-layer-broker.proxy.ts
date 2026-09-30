import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

export const readSourceFileLayerBrokerProxy = (): {
  setupReturns: ({
    filePath,
    content,
  }: {
    filePath: string;
    content: ContentText;
  }) => void;
  setupMissing: ({ filePath }: { filePath: string }) => void;
} => {
  const gatewayProxy = readFileSyncProxy();

  return {
    setupReturns: ({
      filePath,
      content,
    }: {
      filePath: string;
      content: ContentText;
    }): void => {
      gatewayProxy.returns({ path: String(filePath), contents: content });
    },

    setupMissing: ({ filePath }: { filePath: string }): void => {
      gatewayProxy.throws({
        path: String(filePath),
        error: FileMissingErrorStub({ path: String(filePath) }),
      });
    },
  };
};
