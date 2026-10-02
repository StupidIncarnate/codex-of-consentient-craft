import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { freePortPairProxy } from '#gateway/node/net/free-port-pair/free-port-pair.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { unlinkProxy } from '#gateway/node/fs__promises/unlink/unlink.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { portKillListenersBrokerProxy } from '@dungeonmaster/shared/brokers/port/kill-listeners/port-kill-listeners-broker.proxy';

import { tmpdirFindBrokerProxy } from '../../tmpdir/find/tmpdir-find-broker.proxy';
import { e2eArtifactsRemoveBrokerProxy } from '../../e2e-artifacts/remove/e2e-artifacts-remove-broker.proxy';
import { openHandleReportPathTransformer } from '../../../transformers/open-handle-report-path/open-handle-report-path-transformer';

const DEFAULT_SERVER_PORT = 40_000;
const DEFAULT_WEB_PORT = 51_244;
const DEFAULT_COMMAND = 'playwright';

export const runShardLayerBrokerProxy = (): {
  setupPass: (params?: {
    serverPort?: number;
    webPort?: number;
    stdout?: string;
    packagePath?: string;
    command?: string;
  }) => void;
  setupPassWithJsonReport: (params: {
    serverPort?: number;
    webPort?: number;
    jsonContent: string;
    packagePath?: string;
    command?: string;
  }) => void;
  setupPassWithOpenHandles: (params: {
    serverPort?: number;
    webPort?: number;
    handleContent: string;
    packagePath?: string;
    command?: string;
  }) => void;
  setupFail: (params?: {
    serverPort?: number;
    webPort?: number;
    stdout?: string;
    exitCode?: number;
    packagePath?: string;
    command?: string;
  }) => void;
  setupRunNotFound: (params?: {
    serverPort?: number;
    webPort?: number;
    packagePath?: string;
    command?: string;
  }) => void;
  setupSignal: (params: {
    serverPort?: number;
    webPort?: number;
    signal: NodeJS.Signals;
    packagePath?: string;
    command?: string;
  }) => void;
  setupShardedRuns: (params: {
    shardCount: number;
    pairs: readonly { server: number; web: number }[];
    packagePath: string;
    command: string;
    leadingArgs?: readonly string[];
    shardOutputs?: readonly { stdout?: string; exitCode?: number }[];
  }) => void;
  getSpawnedArgs: (params?: {
    command?: string;
    leadingArgs?: readonly string[];
  }) => readonly unknown[] | undefined;
  getAllSpawnedArgs: (params?: {
    command?: string;
    leadingArgs?: readonly string[];
  }) => readonly (readonly string[])[];
  getSpawnedCommandLine: (params?: { command?: string }) => {
    command: string;
    args: readonly unknown[] | undefined;
  };
  getSpawnedEnv: (params?: { command?: string }) => Record<string, string> | undefined;
  getAllSpawnedEnvValues: (params: { key: string; command?: string }) => readonly unknown[];
  getSpawnedOptions: (params?: { command?: string }) => unknown;
  getKilledPorts: () => readonly number[];
  getRemovedCachePaths: (params: { packageRoot: string; port?: number }) => readonly unknown[][];
} => {
  const run = runProxy();
  RunNotFoundErrorProxy();
  const freePort = freePortPairProxy();
  const portKill = portKillListenersBrokerProxy();
  const read = readFileProxy();
  const unlink = unlinkProxy();
  const exists = existsSyncProxy();
  const tmpdir = tmpdirFindBrokerProxy();
  const remove = e2eArtifactsRemoveBrokerProxy();

  const stageCommon = (serverPort: number, webPort: number, packagePath: string): void => {
    tmpdir.returns({ path: '/tmp' });
    freePort.returns({ server: serverPort, web: webPort });
    portKill.setupNoneListening({ port: serverPort });
    portKill.setupNoneListening({ port: webPort });
    remove.setupRemovable({ packageRoot: packagePath, port: serverPort });
    const handlePath = openHandleReportPathTransformer({
      tmpdir: '/tmp',
      checkType: 'e2e',
      processId: serverPort,
    });
    exists.returns({ path: handlePath, exists: false });
  };

  return {
    setupPass: ({
      serverPort = DEFAULT_SERVER_PORT,
      webPort = DEFAULT_WEB_PORT,
      stdout = '',
      packagePath = '/project',
      command = DEFAULT_COMMAND,
    } = {}): void => {
      stageCommon(serverPort, webPort, packagePath);
      run.setupSuccess({
        command,
        exitCode: 0,
        stdout,
        stderr: '',
      });
    },

    setupPassWithJsonReport: ({
      serverPort = DEFAULT_SERVER_PORT,
      webPort = DEFAULT_WEB_PORT,
      jsonContent,
      packagePath = '/project',
      command = DEFAULT_COMMAND,
    }): void => {
      stageCommon(serverPort, webPort, packagePath);
      run.setupSuccess({
        command,
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
      read.returns({
        path: `${packagePath}/.ward-playwright-report-${String(serverPort)}.json`,
        contents: jsonContent,
      });
    },

    setupPassWithOpenHandles: ({
      serverPort = DEFAULT_SERVER_PORT,
      webPort = DEFAULT_WEB_PORT,
      handleContent,
      packagePath = '/project',
      command = DEFAULT_COMMAND,
    }): void => {
      stageCommon(serverPort, webPort, packagePath);
      const handlePath = openHandleReportPathTransformer({
        tmpdir: '/tmp',
        checkType: 'e2e',
        processId: serverPort,
      });
      exists.returns({ path: handlePath, exists: true });
      read.returns({ path: handlePath, contents: handleContent });
      unlink.succeeds({ path: handlePath });
      run.setupSuccess({
        command,
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    },

    setupFail: ({
      serverPort = DEFAULT_SERVER_PORT,
      webPort = DEFAULT_WEB_PORT,
      stdout = '',
      exitCode = 1,
      packagePath = '/project',
      command = DEFAULT_COMMAND,
    } = {}): void => {
      stageCommon(serverPort, webPort, packagePath);
      run.setupSuccess({
        command,
        exitCode,
        stdout,
        stderr: '',
      });
    },

    setupRunNotFound: ({
      serverPort = DEFAULT_SERVER_PORT,
      webPort = DEFAULT_WEB_PORT,
      packagePath = '/project',
      command = DEFAULT_COMMAND,
    } = {}): void => {
      stageCommon(serverPort, webPort, packagePath);
      run.setupError({
        command,
        error: new Error('command not found'),
      });
    },

    setupSignal: ({
      serverPort = DEFAULT_SERVER_PORT,
      webPort = DEFAULT_WEB_PORT,
      signal,
      packagePath = '/project',
      command = DEFAULT_COMMAND,
    }): void => {
      stageCommon(serverPort, webPort, packagePath);
      run.setupSignalKill({
        command,
        signal,
        stdout: '',
        stderr: '',
      });
    },

    setupShardedRuns: ({
      shardCount,
      pairs,
      packagePath,
      command,
      leadingArgs = [],
      shardOutputs,
    }: {
      shardCount: number;
      pairs: readonly { server: number; web: number }[];
      packagePath: string;
      command: string;
      leadingArgs?: readonly string[];
      shardOutputs?: readonly { stdout?: string; exitCode?: number }[];
    }): void => {
      pairs.forEach(({ server, web }) => {
        stageCommon(server, web, packagePath);
      });
      freePort.returnsSequence({ pairs });

      if (shardOutputs === undefined) {
        run.setupSuccess({
          command,
          args: (spawnArgs: readonly unknown[]): boolean =>
            leadingArgs.every((leadingArg, index) => spawnArgs[index] === leadingArg),
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      } else {
        shardOutputs.forEach((shardOutput, index) => {
          const shardNumber = index + 1;
          run.setupSuccess({
            command,
            args: (spawnArgs: readonly unknown[]): boolean =>
              leadingArgs.every((leadingArg, idx) => spawnArgs[idx] === leadingArg) &&
              spawnArgs.includes(`--shard=${shardNumber}/${shardCount}`),
            exitCode: shardOutput.exitCode ?? 0,
            stdout: shardOutput.stdout ?? '',
            stderr: '',
          });
        });
      }
    },

    getSpawnedArgs: ({
      command = DEFAULT_COMMAND,
      leadingArgs = [],
    }: {
      command?: string;
      leadingArgs?: readonly string[];
    } = {}): readonly unknown[] | undefined => {
      const calls = run.getCallsFor({ command });
      const lastCall = calls.at(-1);
      return lastCall?.slice(leadingArgs.length);
    },

    getAllSpawnedArgs: ({
      command = DEFAULT_COMMAND,
      leadingArgs = [],
    }: {
      command?: string;
      leadingArgs?: readonly string[];
    } = {}): readonly (readonly string[])[] =>
      run.getCallsFor({ command }).map((args) => args.slice(leadingArgs.length)),

    getSpawnedCommandLine: ({
      command = DEFAULT_COMMAND,
    }: {
      command?: string;
    } = {}): { command: string; args: readonly unknown[] | undefined } => ({
      command,
      args: run.getCallsFor({ command }).at(-1),
    }),

    getSpawnedEnv: ({
      command = DEFAULT_COMMAND,
    }: {
      command?: string;
    } = {}): Record<string, string> | undefined => run.getOptionsFor({ command }).at(-1)?.env,

    getAllSpawnedEnvValues: ({
      key,
      command = DEFAULT_COMMAND,
    }: {
      key: string;
      command?: string;
    }): readonly unknown[] => run.getOptionsFor({ command }).map((opt) => opt.env[key]),

    getSpawnedOptions: ({
      command = DEFAULT_COMMAND,
    }: {
      command?: string;
    } = {}): unknown => run.getOptionsFor({ command }).at(-1),

    getKilledPorts: (): readonly number[] =>
      run.getCallsFor({ command: 'lsof' }).map((args) => Number(args[1]?.replace(':', ''))),

    getRemovedCachePaths: ({
      packageRoot,
      port = DEFAULT_SERVER_PORT,
    }: {
      packageRoot: string;
      port?: number;
    }): readonly unknown[][] => remove.getRemovedPaths({ packageRoot, port }),
  };
};
