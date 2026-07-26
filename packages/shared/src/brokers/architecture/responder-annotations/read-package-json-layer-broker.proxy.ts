import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readPackageJsonLayerBrokerProxy = (): {
  setupJson: ({ packageRoot, json }: { packageRoot: AbsoluteFilePath; json: unknown }) => void;
  setupMissing: ({ packageRoot }: { packageRoot: AbsoluteFilePath }) => void;
} => {
  const fsProxy = fsReadFileSyncAdapterProxy();

  return {
    setupJson: ({ packageRoot, json }: { packageRoot: AbsoluteFilePath; json: unknown }): void => {
      fsProxy.returns({
        filePath: AbsoluteFilePathStub({ value: `${String(packageRoot)}/package.json` }),
        content: JSON.stringify(json) as ContentText,
      });
    },

    setupMissing: ({ packageRoot }: { packageRoot: AbsoluteFilePath }): void => {
      fsProxy.throws({
        filePath: AbsoluteFilePathStub({ value: `${String(packageRoot)}/package.json` }),
        error: new Error('ENOENT'),
      });
    },
  };
};
