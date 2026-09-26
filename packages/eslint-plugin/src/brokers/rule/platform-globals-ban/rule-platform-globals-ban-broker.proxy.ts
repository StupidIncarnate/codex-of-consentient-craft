import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { eslintTypedParserServicesAdapterProxy } from '../../../adapters/eslint/typed-parser-services/eslint-typed-parser-services-adapter.proxy';
import { isInsideGatewayLayerBrokerProxy } from './is-inside-gateway-layer-broker.proxy';
import { isTypePositionLayerBrokerProxy } from './is-type-position-layer-broker.proxy';
import { isObjectLiteralKeyLabelLayerBrokerProxy } from './is-object-literal-key-label-layer-broker.proxy';
import { propertyIdentifierToCheckLayerBrokerProxy } from './property-identifier-to-check-layer-broker.proxy';
import { resolvePackagePlatformLayerBrokerProxy } from './resolve-package-platform-layer-broker.proxy';
import { resolveGatewayScopeLayerBrokerProxy } from './resolve-gateway-scope-layer-broker.proxy';

/**
 * Proxy for platform-globals-ban rule broker. The rule's own test drives it through
 * eslintTypedRuleTesterAdapter (real ESLint, real TypeScript program) rather than through this
 * proxy — every child construction below is real-passthrough by default, so it never runs.
 */
export const rulePlatformGlobalsBanBrokerProxy = (): {
  createContext: () => EslintContext;
} => {
  eslintTypedParserServicesAdapterProxy();
  isInsideGatewayLayerBrokerProxy();
  isTypePositionLayerBrokerProxy();
  isObjectLiteralKeyLabelLayerBrokerProxy();
  propertyIdentifierToCheckLayerBrokerProxy();
  resolvePackagePlatformLayerBrokerProxy();
  resolveGatewayScopeLayerBrokerProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
  };
};
