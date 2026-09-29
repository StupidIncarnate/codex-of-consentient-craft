import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const readSourceLayerBrokerProxy = (): {
  returns: ({ filePath, content }: { filePath: AbsoluteFilePath; content: ContentText }) => void;
  throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }) => void;
  implementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const gatewayProxy = readFileSyncProxy();

  return {
    returns: ({
      filePath,
      content,
    }: {
      filePath: AbsoluteFilePath;
      content: ContentText;
    }): void => {
      gatewayProxy.returns({ path: filePath, contents: content });
    },

    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      gatewayProxy.throws({ path: filePath, error });
    },

    implementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      gatewayProxy.implementsMatchingPath({
        path: isAbsolutePath,
        fn: (path) => fn(ContentTextStub({ value: path })),
      });
    },
  };
};
