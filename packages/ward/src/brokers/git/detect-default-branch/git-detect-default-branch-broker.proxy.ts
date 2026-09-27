import { run } from '#gateway/node/child_process';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// git-detect-default-branch spawns bare `git` for every rev-parse check, and `run`'s own proxy
// (runProxy) addresses only by `command` — its `setupSuccess`/`setupError` cannot tell the two
// sequential `git` calls this broker issues apart, let alone give them different results. `run`
// itself takes ONE argument object, so mocking `run` directly and addressing by `{command, args}`
// (object staging matches on the keys given, per @dungeonmaster/testing's own mechanics) tells
// every call this broker makes apart by its own args, with no FIFO ordering needed at all.
export const gitDetectDefaultBranchBrokerProxy = (): {
  setupMainExists: () => void;
  setupMasterExists: () => void;
  setupNeitherExists: () => void;
} => {
  // Created but unstaged: runProxy mocks the raw `spawn` one layer below `run`, but this proxy
  // answers `run` itself directly (see the module comment above), so runProxy's own mock of
  // `spawn` is never exercised. Composing it here satisfies enforce-proxy-child-creation.
  runProxy();
  const handle = registerMock({ fn: run });

  return {
    setupMainExists: (): void => {
      handle
        .calledWith([{ command: 'git', args: ['rev-parse', '--verify', 'main'] }])
        .resolves({ exitCode: 0, output: '', signal: null, timedOut: false });
    },

    setupMasterExists: (): void => {
      handle
        .calledWith([{ command: 'git', args: ['rev-parse', '--verify', 'main'] }])
        .resolves({ exitCode: 1, output: 'fatal: not a valid ref', signal: null, timedOut: false });
      handle
        .calledWith([{ command: 'git', args: ['rev-parse', '--verify', 'master'] }])
        .resolves({ exitCode: 0, output: '', signal: null, timedOut: false });
    },

    setupNeitherExists: (): void => {
      handle
        .calledWith([{ command: 'git', args: ['rev-parse', '--verify', 'main'] }])
        .resolves({ exitCode: 1, output: 'fatal: not a valid ref', signal: null, timedOut: false });
      handle
        .calledWith([{ command: 'git', args: ['rev-parse', '--verify', 'master'] }])
        .resolves({ exitCode: 1, output: 'fatal: not a valid ref', signal: null, timedOut: false });
    },
  };
};
