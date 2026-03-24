import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { validateHarnessConstructorSideEffectsLayerBrokerProxy } from './validate-harness-constructor-side-effects-layer-broker.proxy';

/**
 * Proxy for enforce-harness-patterns rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleEnforceHarnessPatternsBrokerProxy = (): {
  createContext: () => EslintContext;
} => {
  validateHarnessConstructorSideEffectsLayerBrokerProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
  };
};
