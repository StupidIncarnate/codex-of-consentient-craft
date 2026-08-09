import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import {
  ExitCodeStub,
  type ExitCode,
  type QuestBranchName,
} from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { gitCheckoutAdapterProxy } from '../../../adapters/git/checkout/git-checkout-adapter.proxy';
import { gitCurrentBranchAdapterProxy } from '../../../adapters/git/current-branch/git-current-branch-adapter.proxy';

// worktreeResumeRestoreBroker spawns bare `git` for BOTH `git rev-parse --abbrev-ref HEAD` and
// `git checkout <branch>`, so `command` alone cannot tell the two calls apart under the shared
// childProcessSpawnCaptureAdapterProxy's command-only addressing — composing
// gitCurrentBranchAdapterProxy + gitCheckoutAdapterProxy directly in one test would make the LAST
// registration answer every call. Addressing on the full args array instead discriminates the two
// calls directly (args compare elementwise), so both outcomes can be staged independently with no
// onceFor/FIFO sequencing needed. Pattern verified in worktree-discard-broker.proxy.ts.
const createGitChild = ({
  exitCode,
  stdout,
  stderr,
}: {
  exitCode: ExitCode;
  stdout: string;
  stderr: string;
}): ChildProcess => {
  const child = new EventEmitter() as ChildProcess;
  child.stdout = new Readable({
    read(): void {
      /* noop */
    },
  });
  child.stderr = new Readable({
    read(): void {
      /* noop */
    },
  });

  const mockStdout = child.stdout;
  const mockStderr = child.stderr;

  setImmediate(() => {
    if (stdout.length > 0) {
      mockStdout.push(Buffer.from(stdout));
    }
    mockStdout.push(null);
    if (stderr.length > 0) {
      mockStderr.push(Buffer.from(stderr));
    }
    mockStderr.push(null);
    child.emit('exit', Number(exitCode), null);
  });

  return child;
};

export const worktreeResumeRestoreBrokerProxy = (): {
  setupOnBranch: (params: { branchName: QuestBranchName }) => void;
  setupDrifted: (params: { currentBranchName: string }) => void;
  setupDetachedHead: () => void;
  setupRevParseFails: (params: { output: string }) => void;
  setupCheckoutSucceeds: (params: { branchName: QuestBranchName }) => void;
  setupCheckoutFails: (params: { branchName: QuestBranchName; output: string }) => void;
  setupBranchWithTrailingWarning: (params: { branchName: QuestBranchName; warning: string }) => void;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const handle = registerMock({ fn: spawn });
  // Created but unstaged to satisfy enforce-proxy-child-creation: this proxy answers `spawn`
  // directly for every git call (see module comment above), so these adapter proxies' own
  // constructor-level defaults never fire.
  gitCurrentBranchAdapterProxy();
  gitCheckoutAdapterProxy();

  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 128 });
  const REV_PARSE_ARGS = ['rev-parse', '--abbrev-ref', 'HEAD'];

  return {
    setupOnBranch: ({ branchName }: { branchName: QuestBranchName }): void => {
      handle
        .calledWith(['git', REV_PARSE_ARGS])
        .implement(() => createGitChild({ exitCode: successCode, stdout: `${branchName}\n`, stderr: '' }));
    },

    setupDrifted: ({ currentBranchName }: { currentBranchName: string }): void => {
      handle
        .calledWith(['git', REV_PARSE_ARGS])
        .implement(() =>
          createGitChild({ exitCode: successCode, stdout: `${currentBranchName}\n`, stderr: '' }),
        );
    },

    setupDetachedHead: (): void => {
      handle
        .calledWith(['git', REV_PARSE_ARGS])
        .implement(() => createGitChild({ exitCode: successCode, stdout: 'HEAD\n', stderr: '' }));
    },

    setupRevParseFails: ({ output }: { output: string }): void => {
      handle
        .calledWith(['git', REV_PARSE_ARGS])
        .implement(() => createGitChild({ exitCode: failCode, stdout: '', stderr: output }));
    },

    setupCheckoutSucceeds: ({ branchName }: { branchName: QuestBranchName }): void => {
      handle
        .calledWith(['git', ['checkout', branchName]])
        .implement(() => createGitChild({ exitCode: successCode, stdout: '', stderr: '' }));
    },

    setupCheckoutFails: ({
      branchName,
      output,
    }: {
      branchName: QuestBranchName;
      output: string;
    }): void => {
      handle
        .calledWith(['git', ['checkout', branchName]])
        .implement(() => createGitChild({ exitCode: failCode, stdout: '', stderr: output }));
    },

    setupBranchWithTrailingWarning: ({
      branchName,
      warning,
    }: {
      branchName: QuestBranchName;
      warning: string;
    }): void => {
      handle
        .calledWith(['git', REV_PARSE_ARGS])
        .implement(() =>
          createGitChild({ exitCode: successCode, stdout: `${branchName}\n`, stderr: `${warning}\n` }),
        );
    },

    getSpawnedArgsList: (): readonly unknown[] =>
      handle.callsMatching(['git']).map((call) => call[1]),
  };
};
