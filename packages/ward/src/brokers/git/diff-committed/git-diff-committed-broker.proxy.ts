import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';

import { gitDetectDefaultBranchBrokerProxy } from '../detect-default-branch/git-detect-default-branch-broker.proxy';
import { gitDetectOriginDefaultBranchBrokerProxy } from '../detect-origin-default-branch/git-detect-origin-default-branch-broker.proxy';

// merge-base and diff are both spawned as bare `git`, exactly like the sequential rev-parse checks
// the two detection brokers issue — runProxy's own staging (addressed by `{command, args}` since
// F25) tells every call this broker's whole chain makes apart, with no ordering games.
export const gitDiffCommittedBrokerProxy = (): {
  setupWithOriginMain: (params: { diffOutput: string }) => void;
  setupWithLocalFallback: (params: { diffOutput: string }) => void;
  setupMergeBaseFails: () => void;
  setupNoBranchAnywhere: () => void;
  setupGitNotFound: () => void;
  getSpawnedArgs: () => readonly unknown[];
  getDiffArgs: () => unknown;
} => {
  const originProxy = gitDetectOriginDefaultBranchBrokerProxy();
  const localProxy = gitDetectDefaultBranchBrokerProxy();
  const run = runProxy();
  // Created but unstaged: RunNotFoundError is a plain class with nothing to mock — composing its
  // proxy satisfies enforce-proxy-child-creation for the broker's own `instanceof` import.
  RunNotFoundErrorProxy();

  const stageMergeBaseThenDiff = ({
    diffOutput,
    baseBranch,
  }: {
    diffOutput: string;
    baseBranch: string;
  }): void => {
    run.setupSuccess({
      command: 'git',
      args: ['merge-base', 'HEAD', baseBranch],
      exitCode: 0,
      stdout: 'abc123\n',
      stderr: '',
    });
    run.setupSuccess({
      command: 'git',
      args: ['diff', '--name-only', '--diff-filter=d', 'abc123', 'HEAD'],
      exitCode: 0,
      stdout: diffOutput,
      stderr: '',
    });
  };

  return {
    setupWithOriginMain: ({ diffOutput }: { diffOutput: string }): void => {
      originProxy.setupOriginMainExists();
      stageMergeBaseThenDiff({ diffOutput, baseBranch: 'origin/main' });
    },

    // No origin refs at all (a fresh `git init`, an offline clone that has never fetched), so the
    // broker drops to the LOCAL default branch rather than answering with nothing.
    setupWithLocalFallback: ({ diffOutput }: { diffOutput: string }): void => {
      originProxy.setupNoOriginRefs();
      localProxy.setupMainExists();
      stageMergeBaseThenDiff({ diffOutput, baseBranch: 'main' });
    },

    // The base ref resolves but shares no history with HEAD (an orphan or force-recreated branch),
    // so there is no range to diff and the broker reports nothing rather than guessing one.
    setupMergeBaseFails: (): void => {
      originProxy.setupOriginMainExists();
      run.setupSuccess({
        command: 'git',
        args: ['merge-base', 'HEAD', 'origin/main'],
        exitCode: 1,
        stdout: '',
        stderr: 'fatal: no merge base',
      });
    },

    setupNoBranchAnywhere: (): void => {
      originProxy.setupNoOriginRefs();
      localProxy.setupNeitherExists();
    },

    // git itself is missing: both detection brokers already fold every rev-parse into "not found",
    // which resolves the base branch to null before this broker ever reaches merge-base or diff.
    setupGitNotFound: (): void => {
      originProxy.setupGitNotFound();
      localProxy.setupGitNotFound();
    },

    getSpawnedArgs: (): readonly unknown[] => run.getCallsFor({ command: 'git' }),

    getDiffArgs: (): unknown => {
      const calls = run.getCallsFor({ command: 'git' });
      return calls.at(-1);
    },
  };
};
