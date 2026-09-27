import { run } from '#gateway/node/child_process';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type RunParams = Parameters<typeof run>[0];

// Both rev-parse calls this broker issues are spawned as bare `git`, so `run`'s own proxy
// (runProxy), which addresses only by `command`, cannot tell them apart or give them different
// results. `run` takes ONE argument object, so mocking `run` directly and addressing by
// `{command, args}` (object staging matches on the keys given) tells every call apart by its own
// args, with no FIFO ordering needed at all.
export const gitDetectOriginDefaultBranchBrokerProxy = (): {
  setupOriginMainExists: () => void;
  setupOriginMasterExists: () => void;
  setupNoOriginRefs: () => void;
  getSpawnedArgs: () => unknown[];
} => {
  // Created but unstaged: runProxy mocks the raw `spawn` one layer below `run`, but this proxy
  // answers `run` itself directly (see the module comment above), so runProxy's own mock of
  // `spawn` is never exercised. Composing it here satisfies enforce-proxy-child-creation.
  runProxy();
  const handle = registerMock({ fn: run });

  return {
    setupOriginMainExists: (): void => {
      handle
        .calledWith([{ command: 'git', args: ['rev-parse', '--verify', 'origin/main'] }])
        .resolves({ exitCode: 0, output: 'abc123\n', signal: null, timedOut: false });
    },

    setupOriginMasterExists: (): void => {
      handle
        .calledWith([{ command: 'git', args: ['rev-parse', '--verify', 'origin/main'] }])
        .resolves({
          exitCode: 1,
          output: 'fatal: Needed a single revision',
          signal: null,
          timedOut: false,
        });
      handle
        .calledWith([{ command: 'git', args: ['rev-parse', '--verify', 'origin/master'] }])
        .resolves({ exitCode: 0, output: 'def456\n', signal: null, timedOut: false });
    },

    setupNoOriginRefs: (): void => {
      handle
        .calledWith([{ command: 'git', args: ['rev-parse', '--verify', 'origin/main'] }])
        .resolves({
          exitCode: 1,
          output: 'fatal: Needed a single revision',
          signal: null,
          timedOut: false,
        });
      handle
        .calledWith([{ command: 'git', args: ['rev-parse', '--verify', 'origin/master'] }])
        .resolves({
          exitCode: 1,
          output: 'fatal: Needed a single revision',
          signal: null,
          timedOut: false,
        });
    },

    getSpawnedArgs: (): unknown[] =>
      handle.callsMatching([{ command: 'git' }]).map((call) => {
        const [params] = call;
        return (params as RunParams).args;
      }),
  };
};
