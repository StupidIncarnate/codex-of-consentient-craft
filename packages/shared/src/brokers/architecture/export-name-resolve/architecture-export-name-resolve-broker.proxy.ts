import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const architectureExportNameResolveBrokerProxy = (): {
  setupReturns: ({
    filePath,
    content,
  }: {
    filePath: AbsoluteFilePath;
    content: ContentText;
  }) => void;
  setupMissing: ({ filePath }: { filePath: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const gatewayProxy = readFileSyncProxy();

  return {
    setupReturns: ({
      filePath,
      content,
    }: {
      filePath: AbsoluteFilePath;
      content: ContentText;
    }): void => {
      gatewayProxy.returns({ path: filePath, contents: content });
    },
    setupMissing: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      gatewayProxy.throws({ path: filePath, error: FileMissingErrorStub({ path: filePath }) });
    },
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      gatewayProxy.implementsMatchingPath({
        path: isAbsolutePath,
        fn: (path) => fn(ContentTextStub({ value: path })),
      });
    },
  };
};
