import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { eslintTypedFunctionTakesNoArgsAdapterProxy } from '../../../adapters/eslint/typed-function-takes-no-args/eslint-typed-function-takes-no-args-adapter.proxy';

/**
 * Proxy for the ban-proxy-empty-called-with rule broker. The rule's own test drives it through
 * eslintTypedRuleTesterAdapter (real ESLint, real TypeScript program) rather than through this
 * proxy — the child construction below is real-passthrough by default, so it never runs.
 */
export const ruleBanProxyEmptyCalledWithBrokerProxy = (): {
  createContext: () => EslintContext;
} => {
  eslintTypedFunctionTakesNoArgsAdapterProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
  };
};
