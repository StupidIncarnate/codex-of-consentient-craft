import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';

/**
 * Proxy for enforce-e2e-base-import rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleEnforceE2eBaseImportBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
} => ({
  createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
});
