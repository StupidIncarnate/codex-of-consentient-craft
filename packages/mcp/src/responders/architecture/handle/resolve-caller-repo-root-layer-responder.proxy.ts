/**
 * PURPOSE: Test setup helper for ResolveCallerRepoRootLayerResponder — composes
 * callerRepoRootResolveBrokerProxy and clears callerCwdScanCursorState for isolation, so a test
 * can seed a cache entry via the state module directly and observe what the responder persists.
 *
 * USAGE:
 * const proxy = ResolveCallerRepoRootLayerResponderProxy();
 * proxy.setupServerCwd({ cwd: '/repo' });
 */

import { callerRepoRootResolveBrokerProxy } from '../../../brokers/caller-repo-root/resolve/caller-repo-root-resolve-broker.proxy';
import { callerCwdScanCursorStateProxy } from '../../../state/caller-cwd-scan-cursor/caller-cwd-scan-cursor-state.proxy';

export const ResolveCallerRepoRootLayerResponderProxy = (): ReturnType<
  typeof callerRepoRootResolveBrokerProxy
> => {
  const stateProxy = callerCwdScanCursorStateProxy();
  stateProxy.setupClear();

  const brokerProxy = callerRepoRootResolveBrokerProxy();

  return { ...brokerProxy };
};
