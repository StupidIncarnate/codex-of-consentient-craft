import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';

/**
 * Proxy for forbid-non-exported-functions rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleForbidNonExportedFunctionsBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
} => ({
  createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
});
