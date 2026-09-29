import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

export const readPackageJsonLayerBrokerProxy = (): {
  setupJson: ({ packageRoot, json }: { packageRoot: AbsoluteFilePath; json: unknown }) => void;
  setupMissing: ({ packageRoot }: { packageRoot: AbsoluteFilePath }) => void;
} => {
  const gatewayProxy = readFileSyncProxy();

  return {
    setupJson: ({ packageRoot, json }: { packageRoot: AbsoluteFilePath; json: unknown }): void => {
      gatewayProxy.returns({
        path: String(AbsoluteFilePathStub({ value: `${String(packageRoot)}/package.json` })),
        contents: JSON.stringify(json),
      });
    },

    setupMissing: ({ packageRoot }: { packageRoot: AbsoluteFilePath }): void => {
      const path = String(AbsoluteFilePathStub({ value: `${String(packageRoot)}/package.json` }));
      gatewayProxy.throws({ path, error: FileMissingErrorStub({ path }) });
    },
  };
};
