/**
 * PURPOSE: Proxy for rule-enforce-hydration-recipes-structure broker mock setup in tests
 *
 * USAGE:
 * const proxy = ruleEnforceHydrationRecipesStructureBrokerProxy();
 * proxy.setupFileSystem((filePath) => ...);
 */
import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';

export const ruleEnforceHydrationRecipesStructureBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
  setupFileSystem: (fileSystemCheck: (path: string) => boolean) => void;
} => {
  const existsProxy = existsSyncProxy();

  return {
    createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
    // existsSyncProxy ships no address-less catch-all: the caller's own decision function is
    // staged as two complementary predicates (matches where it says true, matches where it says
    // false), so exactly one ever answers a given call — never both, never neither.
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
