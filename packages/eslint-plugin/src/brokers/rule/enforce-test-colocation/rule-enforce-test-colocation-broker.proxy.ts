import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';

/**
 * Proxy for enforce-test-colocation rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleEnforceTestColocationBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
  setupFileSystem: (fileSystemCheck: (path: string) => boolean) => void;
} => {
  const existsProxy = existsSyncProxy();

  return {
    createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
    // existsSyncProxy ships no address-less catch-all: the caller's own decision function is
    // staged as two complementary predicates, so exactly one ever answers a given call.
    setupFileSystem: (fileSystemCheck: (path: string) => boolean): void => {
      existsProxy.returnsMatchingPath({
        path: (value) => fileSystemCheck(String(value)),
        exists: true,
      });
      existsProxy.returnsMatchingPath({
        path: (value) => !fileSystemCheck(String(value)),
        exists: false,
      });
    },
  };
};
