/**
 * PURPOSE: Proxy for rule-enforce-hydration-recipes-structure broker mock setup in tests
 *
 * USAGE:
 * const proxy = ruleEnforceHydrationRecipesStructureBrokerProxy();
 * proxy.setupFileSystem((filePath) => ...);
 */
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';

export const ruleEnforceHydrationRecipesStructureBrokerProxy = (): {
  createContext: () => EslintContext;
  setupFileSystem: (fileSystemCheck: (path: string) => boolean) => void;
} => {
  const existsProxy = existsSyncProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
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
