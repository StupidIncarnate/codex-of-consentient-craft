import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { eslintTypedTypeParameterNameAdapterProxy } from '../../../adapters/eslint/typed-type-parameter-name/eslint-typed-type-parameter-name-adapter.proxy';
import { isTypeNameReferencedLayerBrokerProxy } from './is-type-name-referenced-layer-broker.proxy';
import { checkAnyLeakReturnLayerBrokerProxy } from './check-any-leak-return-layer-broker.proxy';
import { isJsonParseOrDynamicImportCallLayerBrokerProxy } from './is-json-parse-or-dynamic-import-call-layer-broker.proxy';

/**
 * Proxy for gateway-return-unknown-not-caller-type rule broker. The rule's own test drives it
 * through eslintTypedRuleTesterAdapter (real ESLint, real TypeScript program) rather than through
 * this proxy — every child construction below is real-passthrough by default, so it never runs.
 */
export const ruleGatewayReturnUnknownNotCallerTypeBrokerProxy = (): {
  createContext: () => EslintContext;
} => {
  eslintTypedTypeParameterNameAdapterProxy();
  isTypeNameReferencedLayerBrokerProxy();
  checkAnyLeakReturnLayerBrokerProxy();
  isJsonParseOrDynamicImportCallLayerBrokerProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
  };
};
