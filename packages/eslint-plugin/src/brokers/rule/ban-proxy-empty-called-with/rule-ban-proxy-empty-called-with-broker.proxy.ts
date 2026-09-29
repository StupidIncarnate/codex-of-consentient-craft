import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { voidSinkSpyLayerBrokerProxy } from './void-sink-spy-layer-broker.proxy';
import { typedSpyMethodTakesNoArgsLayerBrokerProxy } from './typed-spy-method-takes-no-args-layer-broker.proxy';

/**
 * Proxy for the ban-proxy-empty-called-with rule broker. The rule's own test drives it through
 * typedRuleTesterHarness (real ESLint, real TypeScript program) rather than through this
 * proxy.
 */
export const ruleBanProxyEmptyCalledWithBrokerProxy = (): {
  createContext: () => EslintContext;
} => {
  voidSinkSpyLayerBrokerProxy();
  typedSpyMethodTakesNoArgsLayerBrokerProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
  };
};
