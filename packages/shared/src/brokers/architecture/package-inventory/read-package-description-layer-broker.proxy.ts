import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readPackageDescriptionLayerBrokerProxy = (): {
  setupDescription: ({
    packageJsonPath,
    description,
  }: {
    packageJsonPath: AbsoluteFilePath;
    description: ContentText;
  }) => void;
  setupNoPackageJson: ({ packageJsonPath }: { packageJsonPath: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const fsProxy = fsReadFileSyncAdapterProxy();

  return {
    setupDescription: ({
      packageJsonPath,
      description,
    }: {
      packageJsonPath: AbsoluteFilePath;
      description: ContentText;
    }): void => {
      fsProxy.returns({
        filePath: packageJsonPath,
        content: JSON.stringify({ description }) as ContentText,
      });
    },

    setupNoPackageJson: ({ packageJsonPath }: { packageJsonPath: AbsoluteFilePath }): void => {
      fsProxy.throws({ filePath: packageJsonPath, error: new Error('ENOENT') });
    },

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      fsProxy.implementation({ fn });
    },
  };
};
