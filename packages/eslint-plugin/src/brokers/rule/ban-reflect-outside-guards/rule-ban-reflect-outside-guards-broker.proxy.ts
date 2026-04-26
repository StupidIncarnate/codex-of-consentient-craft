/**
 * PURPOSE: Provides mock setup for testing the ban-reflect-outside-guards rule broker
 *
 * USAGE:
 * const proxy = ruleBanReflectOutsideGuardsBrokerProxy();
 * const context = proxy.createContext();
 */
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

export const ruleBanReflectOutsideGuardsBrokerProxy = (): {
  createContext: () => EslintContext;
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
});
