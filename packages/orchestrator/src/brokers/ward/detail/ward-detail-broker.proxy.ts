import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';

import { dungeonmasterBinResolveBrokerProxy } from '../../dungeonmaster-bin/resolve/dungeonmaster-bin-resolve-broker.proxy';

// Matches wardDetailBroker's own WARD_COMMAND — the real command `run` is invoked with, so the
// underlying spawn mock's command-addressed staging matches.
const WARD_COMMAND = 'dungeonmaster-ward';

export const wardDetailBrokerProxy = (): {
  setupSuccess: (params: { output: string }) => void;
  setupFailure: () => void;
  getSpawnedArgs: () => unknown;
  getSpawnedCommand: () => unknown;
} => {
  const run = runProxy();
  // Created but unstaged: RunNotFoundError is a plain class with nothing to mock — composing its
  // proxy satisfies enforce-proxy-child-creation for the broker's own `instanceof` import.
  RunNotFoundErrorProxy();
  getEnvProxy();
  const binProxy = dungeonmasterBinResolveBrokerProxy();

  return {
    // No local ward is installed in these scenarios, so the spawn uses the bare name.
    setupSuccess: ({ output }: { output: string }): void => {
      binProxy.setupNotInstalledAnywhere({ binName: WARD_COMMAND });
      run.setupSuccess({ command: WARD_COMMAND, exitCode: 0, stdout: output, stderr: '' });
    },

    setupFailure: (): void => {
      binProxy.setupNotInstalledAnywhere({ binName: WARD_COMMAND });
      run.setupSuccess({ command: WARD_COMMAND, exitCode: 1, stdout: '', stderr: '' });
    },

    getSpawnedArgs: (): unknown => run.getCallsFor({ command: WARD_COMMAND }).at(-1),

    // `getCallsFor` only ever returns entries addressed by this literal command, so any entry at
    // all is proof the broker really spawned `WARD_COMMAND` (as opposed to some other value it
    // could have read off `getEnv('WARD_CLI_PATH')`).
    getSpawnedCommand: (): unknown => {
      const calls = run.getCallsFor({ command: WARD_COMMAND });
      return calls.length > 0 ? WARD_COMMAND : undefined;
    },
  };
};
