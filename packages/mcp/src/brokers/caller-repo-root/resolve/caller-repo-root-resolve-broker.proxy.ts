/**
 * PURPOSE: Test setup helper for callerRepoRootResolveBroker — stages the server's own cwd and the
 * repo-root walk-up cwdResolveBroker performs on whichever starting path the broker picked.
 *
 * USAGE:
 * const proxy = callerRepoRootResolveBrokerProxy();
 * proxy.setupServerCwd({ cwd: '/repo' });
 * proxy.setupRepoRootAtStart({ startPath: '/repo' });
 */

import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';

export const callerRepoRootResolveBrokerProxy = (): {
  setupServerCwd: (params: { cwd: string }) => void;
  setupRepoRootAtStart: (params: { startPath: string }) => void;
  setupRepoRootInParent: (params: { startPath: string; repoRoot: string }) => void;
  setupRepoRootNotFound: (params: { startPath: string }) => void;
} => {
  const cwdStage = cwdProxy();
  const cwdResolveProxy = cwdResolveBrokerProxy();

  return {
    setupServerCwd: ({ cwd: serverCwd }: { cwd: string }): void => {
      cwdStage.setupCwd({ value: serverCwd });
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
