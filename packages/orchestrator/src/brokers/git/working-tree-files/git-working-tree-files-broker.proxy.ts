import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import { ErrorMessageStub, ExitCodeStub, type ErrorMessage } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { gitDiffFilesAdapterProxy } from '../../../adapters/git/diff-files/git-diff-files-adapter.proxy';
import { gitUntrackedFilesAdapterProxy } from '../../../adapters/git/untracked-files/git-untracked-files-adapter.proxy';

// Both halves of the reading spawn bare `git`, so `command` alone cannot tell them apart under the
// shared childProcessSpawnCaptureAdapterProxy's command-only addressing — that proxy stages a
// SINGLE sticky answer per command, so staging both would silently collapse into whichever was
// registered last, and the untracked half would answer the tracked half's output. Addressing on the
// full args array instead — ['git', ['diff', 'HEAD', '--name-only']] vs ['git', ['ls-files',
// '--others', '--exclude-standard']] — discriminates them directly, so both can be staged up front
// in either order with no onceFor sequencing.
const TRACKED_ARGS = ['diff', 'HEAD', '--name-only'];
const UNTRACKED_ARGS = ['ls-files', '--others', '--exclude-standard'];

const createGitChild = ({ stdout }: { stdout: ErrorMessage }): ChildProcess => {
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
    if (String(stdout).length > 0) {
      mockStdout.push(Buffer.from(String(stdout)));
    }
    mockStdout.push(null);
    mockStderr.push(null);
    child.emit('exit', Number(ExitCodeStub({ value: 0 })), null);
  });

  return child;
};

export const gitWorkingTreeFilesBrokerProxy = (): {
  setupWorkingTree: (params: {
    trackedFiles: readonly string[];
    untrackedFiles: readonly string[];
  }) => void;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const handle = registerMock({ fn: spawn });
  // Created but unstaged: the broker composes both adapters (each of which composes
  // childProcessSpawnCaptureAdapter), but this proxy answers `spawn` directly — see the module
  // comment above — so neither adapter proxy's own staging is ever exercised.
  gitDiffFilesAdapterProxy();
  gitUntrackedFilesAdapterProxy();

  return {
    setupWorkingTree: ({
      trackedFiles,
      untrackedFiles,
    }: {
      trackedFiles: readonly string[];
      untrackedFiles: readonly string[];
    }): void => {
      handle
        .calledWith(['git', TRACKED_ARGS])
        .implement(() =>
          createGitChild({ stdout: ErrorMessageStub({ value: trackedFiles.join('\n') }) }),
        );
      handle
        .calledWith(['git', UNTRACKED_ARGS])
        .implement(() =>
          createGitChild({ stdout: ErrorMessageStub({ value: untrackedFiles.join('\n') }) }),
        );
    },

    getSpawnedArgsList: (): readonly unknown[] =>
      handle.callsMatching(['git']).map((call) => call[1]),
  };
};
