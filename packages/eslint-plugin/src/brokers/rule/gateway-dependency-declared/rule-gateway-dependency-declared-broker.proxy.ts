import { validateGatewaySpecifierLayerBrokerProxy } from './validate-gateway-specifier-layer-broker.proxy';

export const ruleGatewayDependencyDeclaredBrokerProxy = (): {
  setupPackageJson: (args: {
    packageDir: string;
    packageJson: Record<PropertyKey, unknown>;
  }) => void;
} => {
  const validateSpecifierProxy = validateGatewaySpecifierLayerBrokerProxy();

  return {
    setupPackageJson: (args: {
      packageDir: string;
      packageJson: Record<PropertyKey, unknown>;
    }): void => {
      validateSpecifierProxy.setupPackageJson(args);
    },
  };
};
