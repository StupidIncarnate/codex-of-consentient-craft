import { readPackageJsonLayerBrokerProxy } from './read-package-json-layer-broker.proxy';

export const cliBinToAnnotationsLayerBrokerProxy = (): {
  setupJson: ({ json }: { json: unknown }) => void;
  setupMissing: () => void;
} => {
  const pkgJsonProxy = readPackageJsonLayerBrokerProxy();

  return {
    setupJson: ({ json }: { json: unknown }): void => {
      pkgJsonProxy.setupJson({ json });
    },
    setupMissing: (): void => {
      pkgJsonProxy.setupMissing();
    },
  };
};
