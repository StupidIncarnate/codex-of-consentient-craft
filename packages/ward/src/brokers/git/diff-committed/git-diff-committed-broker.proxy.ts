import { run } from '#gateway/node/child_process';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { gitDetectDefaultBranchBrokerProxy } from '../detect-default-branch/git-detect-default-branch-broker.proxy';
import { gitDetectOriginDefaultBranchBrokerProxy } from '../detect-origin-default-branch/git-detect-origin-default-branch-broker.proxy';

type RunParams = Parameters<typeof run>[0];

// merge-base and diff are both spawned as bare `git`, exactly like the sequential rev-parse checks
// the two detection brokers issue — `run`'s own proxy (runProxy), which addresses only by
// `command`, cannot tell them apart. `run` takes ONE argument object, so mocking `run` directly and
// addressing by `{command, args}` tells every call apart by its own args, with no ordering games.
export const gitDiffCommittedBrokerProxy = (): {
  setupWithOriginMain: (params: { diffOutput: string }) => void;
  setupWithLocalFallback: (params: { diffOutput: string }) => void;
  setupMergeBaseFails: () => void;
  setupNoBranchAnywhere: () => void;
  getSpawnedArgs: () => unknown[];
  getDiffArgs: () => unknown;
} => {
  const originProxy = gitDetectOriginDefaultBranchBrokerProxy();
  const localProxy = gitDetectDefaultBranchBrokerProxy();
  // Created but unstaged: see the module comment above — `run` is mocked directly below rather
  // than through runProxy, which addresses only by `command`. Composing it here satisfies
  // enforce-proxy-child-creation.
  runProxy();
  const handle = registerMock({ fn: run });

  const stageMergeBaseThenDiff = ({
    diffOutput,
    baseBranch,
  }: {
    diffOutput: string;
    baseBranch: string;
  }): void => {
    handle
      .calledWith([{ command: 'git', args: ['merge-base', 'HEAD', baseBranch] }])
      .resolves({ exitCode: 0, output: 'abc123\n', signal: null, timedOut: false });
    handle
      .calledWith([
        { command: 'git', args: ['diff', '--name-only', '--diff-filter=d', 'abc123', 'HEAD'] },
      ])
      .resolves({ exitCode: 0, output: diffOutput, signal: null, timedOut: false });
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
      handle
        .calledWith([{ command: 'git', args: ['merge-base', 'HEAD', 'origin/main'] }])
        .resolves({ exitCode: 1, output: 'fatal: no merge base', signal: null, timedOut: false });
    },

    setupNoBranchAnywhere: (): void => {
      originProxy.setupNoOriginRefs();
      localProxy.setupNeitherExists();
    },

    getSpawnedArgs: (): unknown[] =>
      handle.callsMatching([{ command: 'git' }]).map((call) => {
        const [params] = call;
        return (params as RunParams).args;
      }),

    getDiffArgs: (): unknown => {
      const calls = handle.callsMatching([{ command: 'git' }]);
      const lastCall = calls.at(-1);
      const [params] = lastCall ?? [];
      return params === undefined ? undefined : (params as RunParams).args;
    },
  };
};
