/**
 * PURPOSE: Proxy for gateway-import-boundary rule broker
 *
 * USAGE:
 * ruleGatewayImportBoundaryBrokerProxy();
 *
 * WHEN-TO-USE: Empty proxy - ESLint rules run with real parsing to validate DSL logic, and every
 * RuleTester case overrides `scope` via rule options instead of mocking the filesystem. The child
 * proxies below satisfy enforce-proxy-child-creation; this file is never imported by the rule's own
 * RuleTester test, so mocking `minimatch`/the scope walk here never reaches it.
 */
import { repoScopeResolveBrokerProxy } from '../../repo-scope/resolve/repo-scope-resolve-broker.proxy';
import { configWorkspacePackageNamesBrokerProxy } from '../../config/workspace-package-names/config-workspace-package-names-broker.proxy';

export const ruleGatewayImportBoundaryBrokerProxy = (): Record<PropertyKey, never> => {
  repoScopeResolveBrokerProxy();
  configWorkspacePackageNamesBrokerProxy();

  return {};
};
