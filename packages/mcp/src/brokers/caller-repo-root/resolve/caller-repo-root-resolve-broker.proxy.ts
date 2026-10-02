/**
 * PURPOSE: Test setup helper for callerRepoRootResolveBroker — stages the repo-root walk-up
 * cwdResolveBroker performs on whichever starting path the broker picked.
 *
 * USAGE:
 * const proxy = callerRepoRootResolveBrokerProxy();
 * proxy.setupRepoRootAtStart({ startPath: '/repo' });
 */

import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';

export const callerRepoRootResolveBrokerProxy = (): {
  setupRepoRootAtStart: (params: { startPath: string }) => void;
  setupRepoRootInParent: (params: { startPath: string; repoRoot: string }) => void;
  setupRepoRootNotFound: (params: { startPath: string }) => void;
} => {
  const cwdResolveProxy = cwdResolveBrokerProxy();

  return {
    setupRepoRootAtStart: ({ startPath }: { startPath: string }): void => {
      cwdResolveProxy.setupRepoRootFoundAtStart({ startPath });
    },
    setupRepoRootInParent: ({
      startPath,
      repoRoot,
    }: {
      startPath: string;
      repoRoot: string;
    }): void => {
      cwdResolveProxy.setupRepoRootFoundInParent({ startPath, repoRoot });
    },
    setupRepoRootNotFound: ({ startPath }: { startPath: string }): void => {
      cwdResolveProxy.setupRepoRootNotFound({ startPath });
    },
  };
};
