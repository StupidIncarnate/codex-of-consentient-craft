import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { execPath } from '#gateway/node/process';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { packageBinResolveBrokerProxy } from '@dungeonmaster/shared/brokers/package-bin/resolve/package-bin-resolve-broker.proxy';

// Matches wardDetailBroker's own WARD_COMMAND, which names the binary packageBinResolveBroker resolves.
const WARD_COMMAND = 'dungeonmaster-ward';
const WARD_PACKAGE = '@dungeonmaster/ward';
const DETAIL_SUBCOMMAND = 'detail';
const WARD_ENTRY = './dist/bin/ward-entry.js';

export const wardDetailBrokerProxy = (): {
  setupSuccess: (params: { startPath: string; output: string }) => void;
  setupFailure: (params: { startPath: string }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedCommand: () => unknown;
} => {
  const run = runProxy();
  // Created but unstaged: RunNotFoundError is a plain class with nothing to mock — composing its
  // proxy satisfies enforce-proxy-child-creation for the broker's own `instanceof` import.
  RunNotFoundErrorProxy();
  getEnvProxy();
  const binProxy = packageBinResolveBrokerProxy();

  // The run root holds the ward package, so the spawn is `node <its entry script> detail ...`; the
  // args predicate keeps this stage apart from the ward handler's own `run` spawn on the same node.
  const stageDetailSpawn = ({
    startPath,
    exitCode,
    stdout,
  }: {
    startPath: string;
    exitCode: number;
    stdout: string;
  }): void => {
    binProxy.setupManifestInRunRoot({
      packageName: WARD_PACKAGE,
      repoRoot: startPath,
      manifestPath: `${startPath}/node_modules/${WARD_PACKAGE}/package.json`,
      rawManifest: JSON.stringify({ bin: { [WARD_COMMAND]: WARD_ENTRY } }),
    });
    run.setupSuccess({
      command: execPath,
      args: (args: readonly unknown[]): boolean => args[1] === DETAIL_SUBCOMMAND,
      exitCode,
      stdout,
      stderr: '',
    });
  };

  return {
    setupSuccess: ({ startPath, output }: { startPath: string; output: string }): void => {
      stageDetailSpawn({ startPath, exitCode: 0, stdout: output });
    },

    setupFailure: ({ startPath }: { startPath: string }): void => {
      stageDetailSpawn({ startPath, exitCode: 1, stdout: '' });
    },

    getSpawnedArgs: (): unknown => run.getCallsFor({ command: execPath }).at(-1),

    // `getCallsFor` only ever returns entries addressed by `execPath`, so any entry at all is proof
    // the broker spawned node on the resolved entry script rather than some `WARD_CLI_PATH` value.
    getSpawnedCommand: (): unknown => {
      const calls = run.getCallsFor({ command: execPath });
      return calls.length > 0 ? execPath : undefined;
    },
  };
};
