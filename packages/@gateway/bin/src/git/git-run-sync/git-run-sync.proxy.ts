import { runSyncWithInputProxy } from '#gateway/node/child_process/run-sync-with-input/run-sync-with-input.proxy';

// Stages at the spawn level through #gateway/node/child_process's own runSyncWithInputProxy, never
// `registerMock({ fn: runSyncWithInput })` — mocking the inner wrapper would replace its real body
// for every other caller composed into the same test. Every address is command + exact args + cwd,
// so two git calls in one test stage apart.
const COMMAND = 'git';

export const gitRunSyncProxy = (): {
  setupResult: (params: { args: string[]; cwd: string; stdout: string }) => void;
  setupFailure: (params: {
    args: string[];
    cwd: string;
    status: number | null;
    stderr: string;
    signal?: NodeJS.Signals;
  }) => void;
  getEnvFor: (params: { args: string[]; cwd: string }) => unknown;
} => {
  const run = runSyncWithInputProxy();

  return {
    setupResult: ({ args, cwd, stdout }): void => {
      run.setupResult({ command: COMMAND, args, cwd, status: 0, stdout, stderr: '' });
    },

    setupFailure: ({ args, cwd, status, stderr, signal }): void => {
      run.setupResult({
        command: COMMAND,
        args,
        cwd,
        status,
        stdout: '',
        stderr,
        ...(signal === undefined ? {} : { signal }),
      });
    },

    getEnvFor: ({ args, cwd }): unknown => run.getSpawnedEnvFor({ command: COMMAND, args, cwd }),
  };
};
