/**
 * PURPOSE: Provides mock setup for testing the ban-reflect-outside-guards rule broker
 *
 * USAGE:
 * const proxy = ruleBanReflectOutsideGuardsBrokerProxy();
 * const context = proxy.createContext();
 */
import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';

export const ruleBanReflectOutsideGuardsBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
} => ({
  createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
});
