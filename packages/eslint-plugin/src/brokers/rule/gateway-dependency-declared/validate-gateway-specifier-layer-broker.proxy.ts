import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { findNearestPackageJsonLayerBrokerProxy } from './find-nearest-package-json-layer-broker.proxy';

export const validateGatewaySpecifierLayerBrokerProxy = (): {
  setupPackageJson: (args: {
    packageDir: string;
    packageJson: Record<PropertyKey, unknown>;
  }) => void;
  setupNoPackageJsonAt: (args: { dirPath: string }) => void;
} => {
  existsSyncProxy();
  readFileSyncProxy();
  const nearestPackageJsonProxy = findNearestPackageJsonLayerBrokerProxy();

  return {
    setupPackageJson: (args: {
      packageDir: string;
      packageJson: Record<PropertyKey, unknown>;
    }): void => {
      nearestPackageJsonProxy.setupPackageJson(args);
    },
    setupNoPackageJsonAt: (args: { dirPath: string }): void => {
      nearestPackageJsonProxy.setupNoPackageJsonAt(args);
    },
  };
};
