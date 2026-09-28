/**
 * PURPOSE: Proxy for raw-import-ban rule broker
 *
 * USAGE:
 * ruleRawImportBanBrokerProxy();
 *
 * WHEN-TO-USE: Empty proxy - ESLint rules run with real parsing to validate DSL logic, and every
 * RuleTester case overrides `scope` via rule options instead of mocking the filesystem. The child
 * proxies below satisfy enforce-proxy-child-creation; this file is never imported by the rule's
 * own RuleTester test, so mocking `minimatch`/the scope walk here never reaches it.
 */
import { repoScopeResolveBrokerProxy } from '../../repo-scope/resolve/repo-scope-resolve-broker.proxy';

export const ruleRawImportBanBrokerProxy = (): Record<PropertyKey, never> => {
  repoScopeResolveBrokerProxy();

  return {};
};
