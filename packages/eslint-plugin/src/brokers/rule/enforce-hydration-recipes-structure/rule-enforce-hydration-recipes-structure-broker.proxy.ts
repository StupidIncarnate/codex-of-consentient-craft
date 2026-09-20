/**
 * PURPOSE: Proxy for rule-enforce-hydration-recipes-structure broker mock setup in tests
 *
 * USAGE:
 * const proxy = ruleEnforceHydrationRecipesStructureBrokerProxy();
 * proxy.setupFileSystem((filePath) => ...);
 */
import type { PathLike } from 'fs';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';

export const ruleEnforceHydrationRecipesStructureBrokerProxy = (): {
  createContext: () => EslintContext;
  setupFileSystem: (fileSystemCheck: (path: PathLike) => boolean) => void;
} => {
  const fsExistsSyncProxy = fsExistsSyncAdapterProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
    setupFileSystem: (fileSystemCheck: (path: PathLike) => boolean): void => {
      fsExistsSyncProxy.setupFileSystem(fileSystemCheck);
    },
  };
};
