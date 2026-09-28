/**
 * PURPOSE: Test setup helper for ResolveCallerRepoRootLayerResponder — delegates entirely to
 * callerRepoRootResolveBrokerProxy, since the responder itself does nothing beyond calling the
 * broker.
 *
 * USAGE:
 * const proxy = ResolveCallerRepoRootLayerResponderProxy();
 * proxy.setupServerCwd({ cwd: '/repo' });
 */

import { callerRepoRootResolveBrokerProxy } from '../../../brokers/caller-repo-root/resolve/caller-repo-root-resolve-broker.proxy';

export const ResolveCallerRepoRootLayerResponderProxy = (): ReturnType<
  typeof callerRepoRootResolveBrokerProxy
> => callerRepoRootResolveBrokerProxy();
