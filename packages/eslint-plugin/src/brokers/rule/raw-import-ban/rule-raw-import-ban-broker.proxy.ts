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
import { minimatchMatchAdapterProxy } from '../../../adapters/minimatch/match/minimatch-match-adapter.proxy';
import { resolveRepoScopeLayerBrokerProxy } from './resolve-repo-scope-layer-broker.proxy';

export const ruleRawImportBanBrokerProxy = (): Record<PropertyKey, never> => {
  minimatchMatchAdapterProxy();
  resolveRepoScopeLayerBrokerProxy();

  return {};
};
