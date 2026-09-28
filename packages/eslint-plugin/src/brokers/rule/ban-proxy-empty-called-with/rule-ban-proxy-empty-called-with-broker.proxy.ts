import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

/**
 * Proxy for the ban-proxy-empty-called-with rule broker. The rule's own test drives it through
 * typedRuleTesterHarness (real ESLint, real TypeScript program) rather than through this
 * proxy.
 */
export const ruleBanProxyEmptyCalledWithBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
