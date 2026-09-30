import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const isAbsolutePath = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('/');

export const readPackageDescriptionLayerBrokerProxy = (): {
  setupDescription: ({
    packageJsonPath,
    description,
  }: {
    packageJsonPath: string;
    description: ContentText;
  }) => void;
  setupNoPackageJson: ({ packageJsonPath }: { packageJsonPath: string }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const gatewayProxy = readFileSyncProxy();

  return {
    setupDescription: ({
      packageJsonPath,
      description,
    }: {
      packageJsonPath: string;
      description: ContentText;
    }): void => {
      gatewayProxy.returns({
        path: packageJsonPath,
        contents: JSON.stringify({ description }),
      });
    },

    setupNoPackageJson: ({ packageJsonPath }: { packageJsonPath: string }): void => {
      gatewayProxy.throws({
        path: packageJsonPath,
        error: FileMissingErrorStub({ path: packageJsonPath }),
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
