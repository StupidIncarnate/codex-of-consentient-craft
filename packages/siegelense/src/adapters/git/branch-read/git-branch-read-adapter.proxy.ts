/**
 * PURPOSE: Proxy for gitBranchReadAdapter — intercepts `child_process.execSync` to stage the
 * branch name returned or simulate detached HEAD / error scenarios.
 *
 * USAGE:
 * const proxy = gitBranchReadAdapterProxy();
 * proxy.setupBranch({ branch: 'feat/def-04' });
 */

import { execSync } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const gitBranchReadAdapterProxy = (): {
  setupBranch: (params: { branch: string | null }) => void;
  setupThrows: () => void;
} => {
  const execSyncHandle: MockHandle = registerMock({ fn: execSync });
  execSyncHandle
    .calledWith([
      'git rev-parse --abbrev-ref HEAD',
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ])
    .returns('HEAD');

  return {
    setupBranch: ({ branch }: { branch: string | null }): void => {
      execSyncHandle
        .calledWith([
          'git rev-parse --abbrev-ref HEAD',
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
        ])
        .returns(branch === null ? 'HEAD' : `${branch}\n`);
    },
    setupThrows: (): void => {
      execSyncHandle
        .calledWith([
          'git rev-parse --abbrev-ref HEAD',
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
        ])
        .throws(new Error('fatal: not a git repository'));
    },
  };
};
