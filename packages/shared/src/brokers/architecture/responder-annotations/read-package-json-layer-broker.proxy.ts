import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

export const readPackageJsonLayerBrokerProxy = (): {
  setupJson: ({ packageRoot, json }: { packageRoot: string; json: unknown }) => void;
  setupMissing: ({ packageRoot }: { packageRoot: string }) => void;
} => {
  const gatewayProxy = readFileSyncProxy();

  return {
    setupJson: ({ packageRoot, json }: { packageRoot: string; json: unknown }): void => {
      gatewayProxy.returns({
        path: `${packageRoot}/package.json`,
        contents: JSON.stringify(json),
      });
    },

    setupMissing: ({ packageRoot }: { packageRoot: string }): void => {
      const path = `${packageRoot}/package.json`;
      gatewayProxy.throws({ path, error: FileMissingErrorStub({ path }) });
    },
  };
};
