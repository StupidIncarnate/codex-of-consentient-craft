import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { checkPrimitiveViolationLayerBrokerProxy } from './check-primitive-violation-layer-broker.proxy';

/**
 * Proxy for ban-primitives rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleBanPrimitivesBrokerProxy = (): {
  createContext: () => EslintContext;
} => {
  checkPrimitiveViolationLayerBrokerProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
  };
};
