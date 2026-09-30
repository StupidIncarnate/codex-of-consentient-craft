import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const architectureSourceReadBrokerProxy = (): {
  setupReturns: ({
    filePath,
    content,
  }: {
    filePath: string;
    content: ContentText;
  }) => void;
  setupMissing: ({ filePath }: { filePath: string }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
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

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      gatewayProxy.implementsMatchingPath({
        path: isAbsolutePath,
        fn: (path) => fn(ContentTextStub({ value: path })),
      });
    },
  };
};
