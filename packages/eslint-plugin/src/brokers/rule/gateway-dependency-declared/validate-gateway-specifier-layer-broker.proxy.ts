import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { findNearestPackageJsonLayerBrokerProxy } from './find-nearest-package-json-layer-broker.proxy';

export const validateGatewaySpecifierLayerBrokerProxy = (): {
  setupPackageJson: (args: {
    packageDir: string;
    packageJson: Record<PropertyKey, unknown>;
  }) => void;
} => {
  // Constructed for its own default real-passthrough behavior and only to satisfy
  // enforce-proxy-child-creation — validateGatewaySpecifierLayerBroker imports pathDirnameAdapter
  // directly, but every test case here stages a real filename/packageDir pair, so the real
  // dirname computation is exactly what each test wants.
  pathDirnameAdapterProxy();

  const nearestPackageJsonProxy = findNearestPackageJsonLayerBrokerProxy();

  return {
    setupPackageJson: (args: {
      packageDir: string;
      packageJson: Record<PropertyKey, unknown>;
    }): void => {
      nearestPackageJsonProxy.setupPackageJson(args);
    },
  };
};
