/**
 * PURPOSE: Test setup helper for ResolveCallerRepoRootLayerResponder — stages the server's own cwd
 * the responder reads, and delegates the repo-root walk-up staging to
 * callerRepoRootResolveBrokerProxy.
 *
 * USAGE:
 * const proxy = ResolveCallerRepoRootLayerResponderProxy();
 * proxy.setupServerCwd({ cwd: '/repo' });
 */

import { callerRepoRootResolveBrokerProxy } from '../../../brokers/caller-repo-root/resolve/caller-repo-root-resolve-broker.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';

export const ResolveCallerRepoRootLayerResponderProxy = (): ReturnType<
  typeof callerRepoRootResolveBrokerProxy
> & { setupServerCwd: (params: { cwd: string }) => void } => {
  const cwdStage = cwdProxy();
  const brokerProxy = callerRepoRootResolveBrokerProxy();

  return {
    ...brokerProxy,
    setupServerCwd: ({ cwd: serverCwd }: { cwd: string }): void => {
      cwdStage.setupCwd({ value: serverCwd });
    },
  };
};
