/**
 * PURPOSE: Test setup helper for callerRepoRootResolveBroker — stages the server's own cwd and the
 * repo-root walk-up cwdResolveBroker performs on whichever starting path the broker picked.
 *
 * USAGE:
 * const proxy = callerRepoRootResolveBrokerProxy();
 * proxy.setupServerCwd({ cwd: '/repo' });
 * proxy.setupRepoRootAtStart({ startPath: '/repo' });
 */

import { processCwdAdapterProxy, cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';

export const callerRepoRootResolveBrokerProxy = (): {
  setupServerCwd: (params: { cwd: string }) => void;
  setupRepoRootAtStart: (params: { startPath: string }) => void;
  setupRepoRootInParent: (params: { startPath: string; repoRoot: string }) => void;
  setupRepoRootNotFound: (params: { startPath: string }) => void;
} => {
  const processCwdProxy = processCwdAdapterProxy();
  const cwdResolveProxy = cwdResolveBrokerProxy();

  return {
    setupServerCwd: ({ cwd }: { cwd: string }): void => {
      processCwdProxy.returns({ path: cwd });
    },
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
