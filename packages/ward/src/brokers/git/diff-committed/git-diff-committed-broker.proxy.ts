import { diffFilesProxy } from '#gateway/bin/git/diff-files/diff-files.proxy';
import { GitNotInstalledErrorProxy } from '#gateway/bin/git/git-run/git-not-installed.error.proxy';
import { gitRunProxy } from '#gateway/bin/git/git-run/git-run.proxy';

import { gitDetectDefaultBranchBrokerProxy } from '../detect-default-branch/git-detect-default-branch-broker.proxy';
import { gitDetectOriginDefaultBranchBrokerProxy } from '../detect-origin-default-branch/git-detect-origin-default-branch-broker.proxy';

// Every git call this broker's chain makes is addressed by its exact args through the gateway's own
// proxies: the two detection brokers' proxies, gitRunProxy for merge-base, diffFilesProxy for the
// diff. The merge-base the test stages is the literal below, so the diff address derives from it.
const MERGE_BASE = 'abc123';

export const gitDiffCommittedBrokerProxy = (): {
  setupWithOriginMain: (params: { diffOutput: string }) => void;
  setupWithLocalFallback: (params: { diffOutput: string }) => void;
  setupMergeBaseFails: () => void;
  setupNoBranchAnywhere: () => void;
  setupGitNotFound: () => void;
  setupGitNotFoundAtMergeBase: () => void;
  getOriginRevParseCalls: () => readonly unknown[][];
  getMergeBaseCalls: (params: { baseBranch: string }) => readonly unknown[][];
  getDiffCalls: () => readonly unknown[][];
} => {
  const originProxy = gitDetectOriginDefaultBranchBrokerProxy();
  const localProxy = gitDetectDefaultBranchBrokerProxy();
  const gitRun = gitRunProxy();
  const diffFiles = diffFilesProxy();
  // Created but unstaged: GitNotInstalledError is a plain class with nothing to mock.
  GitNotInstalledErrorProxy();

  const stageMergeBaseThenDiff = ({
    diffOutput,
    baseBranch,
  }: {
    diffOutput: string;
    baseBranch: string;
  }): void => {
    gitRun.setupResult({
      args: ['merge-base', 'HEAD', baseBranch],
      exitCode: 0,
      output: `${MERGE_BASE}\n`,
    });
    diffFiles.setupResult({
      revisionArg: `${MERGE_BASE}...HEAD`,
      excludeDeleted: true,
      exitCode: 0,
      output: diffOutput,
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
      gitRun.setupResult({
        args: ['merge-base', 'HEAD', 'origin/main'],
        exitCode: 1,
        output: 'fatal: no merge base',
      });
    },

    setupNoBranchAnywhere: (): void => {
      originProxy.setupNoOriginRefs();
      localProxy.setupNeitherExists();
    },

    // git itself is missing: both detection brokers fold it into "not found", which resolves the
    // base branch to null before this broker ever reaches merge-base or diff.
    setupGitNotFound: (): void => {
      originProxy.setupGitNotFound();
      localProxy.setupGitNotFound();
    },

    // git vanishes only once the base branch has resolved: the merge-base call itself cannot start.
    setupGitNotFoundAtMergeBase: (): void => {
      originProxy.setupOriginMainExists();
      gitRun.setupNotFound({ args: ['merge-base', 'HEAD', 'origin/main'] });
    },

    getOriginRevParseCalls: (): readonly unknown[][] => originProxy.getSpawnedCalls(),

    getMergeBaseCalls: ({ baseBranch }: { baseBranch: string }): readonly unknown[][] =>
      gitRun.getCallsFor({ args: ['merge-base', 'HEAD', baseBranch] }),

    getDiffCalls: (): readonly unknown[][] =>
      diffFiles.getCallsFor({ revisionArg: `${MERGE_BASE}...HEAD`, excludeDeleted: true }),
  };
};
