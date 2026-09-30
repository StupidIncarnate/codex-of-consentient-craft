import { readPackageJsonLayerBrokerProxy } from './read-package-json-layer-broker.proxy';

export const cliBinToAnnotationsLayerBrokerProxy = (): {
  setupJson: ({ packageRoot, json }: { packageRoot: string; json: unknown }) => void;
  setupMissing: ({ packageRoot }: { packageRoot: string }) => void;
} => {
  const pkgJsonProxy = readPackageJsonLayerBrokerProxy();

  return {
    setupJson: ({ packageRoot, json }: { packageRoot: string; json: unknown }): void => {
      pkgJsonProxy.setupJson({ packageRoot, json });
    },
    setupMissing: ({ packageRoot }: { packageRoot: string }): void => {
      pkgJsonProxy.setupMissing({ packageRoot });
    },
  };
};
