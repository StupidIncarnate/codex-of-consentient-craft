import { run } from '#gateway/node/child_process';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type RunParams = Parameters<typeof run>[0];

// The `git diff` and the `git ls-files` are both spawned as bare `git`, so `run`'s own proxy
// (runProxy), which addresses only by `command`, cannot tell them apart. `run` takes ONE argument
// object, so mocking `run` directly and addressing by `{command, args}` tells the two calls apart
// by their own args — the broker awaits them through Promise.all, so no ordering matters anyway.
export const gitDiffUncommittedBrokerProxy = (): {
  setupWorkingTree: (params: { trackedOutput: string; untrackedOutput: string }) => void;
  getSpawnedArgs: () => unknown[];
} => {
  // Created but unstaged: see the module comment above — `run` is mocked directly below rather
  // than through runProxy, which addresses only by `command`. Composing it here satisfies
  // enforce-proxy-child-creation.
  runProxy();
  const handle = registerMock({ fn: run });

  return {
    setupWorkingTree: ({
      trackedOutput,
      untrackedOutput,
    }: {
      trackedOutput: string;
      untrackedOutput: string;
    }): void => {
      handle
        .calledWith([{ command: 'git', args: ['diff', '--name-only', '--diff-filter=d', 'HEAD'] }])
        .resolves({ exitCode: 0, output: trackedOutput, signal: null, timedOut: false });
      handle
        .calledWith([{ command: 'git', args: ['ls-files', '--others', '--exclude-standard'] }])
        .resolves({ exitCode: 0, output: untrackedOutput, signal: null, timedOut: false });
    },

    getSpawnedArgs: (): unknown[] =>
      handle.callsMatching([{ command: 'git' }]).map((call) => {
        const [params] = call;
        return (params as RunParams).args;
      }),
  };
};
