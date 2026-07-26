import { readPackageJsonLayerBrokerProxy } from './read-package-json-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const hookBinsToAnnotationsLayerBrokerProxy = (): {
  setupJson: ({ packageRoot, json }: { packageRoot: AbsoluteFilePath; json: unknown }) => void;
  setupMissing: ({ packageRoot }: { packageRoot: AbsoluteFilePath }) => void;
} => {
  const pkgJsonProxy = readPackageJsonLayerBrokerProxy();

  return {
    setupJson: ({ packageRoot, json }: { packageRoot: AbsoluteFilePath; json: unknown }): void => {
      pkgJsonProxy.setupJson({ packageRoot, json });
    },
    setupMissing: ({ packageRoot }: { packageRoot: AbsoluteFilePath }): void => {
      pkgJsonProxy.setupMissing({ packageRoot });
    },
  };
};
