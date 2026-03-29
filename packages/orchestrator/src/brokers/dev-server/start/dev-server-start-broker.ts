/**
 * PURPOSE: Kills stale processes on the dev server ports, spawns the dev server command, and waits for readiness
 *
 * USAGE:
 * const result = await devServerStartBroker({
 *   devCommand: 'npm run dev',
 *   port: 3000,
 *   hostname: 'localhost',
 *   readinessPath: '/',
 *   readinessTimeoutMs: 30000,
 *   cwd: '/project' as AbsoluteFilePath,
 * });
 * // Returns { process: ChildProcess; url: DevServerUrl }
 * // Throws if server exits before ready or readiness times out
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  devServerUrlContract,
  type DevServerUrl,
} from '../../../contracts/dev-server-url/dev-server-url-contract';
import { childProcessSpawnAdapter } from '../../../adapters/child-process/spawn/child-process-spawn-adapter';
import { httpReadinessPollAdapter } from '../../../adapters/http/readiness-poll/http-readiness-poll-adapter';
import { processKillByPortAdapter } from '../../../adapters/process/kill-by-port/process-kill-by-port-adapter';

type DevServerProcess = ReturnType<typeof childProcessSpawnAdapter>;

export const devServerStartBroker = async ({
  devCommand,
  port,
  hostname,
  readinessPath,
  readinessTimeoutMs,
  cwd,
  abortSignal,
}: {
  devCommand: string;
  port: number;
  hostname: string;
  readinessPath: string;
  readinessTimeoutMs: number;
  cwd: AbsoluteFilePath;
  abortSignal?: AbortSignal;
}): Promise<{ process: DevServerProcess; url: DevServerUrl }> => {
  processKillByPortAdapter({ port });
  processKillByPortAdapter({ port: port + 1 });

  const parts = devCommand.split(' ').filter(Boolean);
  const [command, ...args] = parts;

  if (command === undefined) {
    throw new Error('Dev command is empty');
  }

  const childProcess = childProcessSpawnAdapter({
    command,
    args,
    options: { cwd, detached: false, stdio: 'pipe' },
  });

  const url = devServerUrlContract.parse(`http://${hostname}:${port}`);
  const pollUrl = `${url}${readinessPath}`;

  const exitRace = new Promise<never>((_resolve, reject) => {
    childProcess.once('exit', (code) => {
      reject(
        new Error(`Dev server process exited before becoming ready (exit code: ${String(code)})`),
      );
    });

    childProcess.once('error', (err) => {
      reject(new Error(`Dev server process error before becoming ready: ${String(err)}`));
    });
  });

  const readinessPoll = httpReadinessPollAdapter({
    url: pollUrl,
    timeoutMs: readinessTimeoutMs,
    ...(abortSignal === undefined ? {} : { abortSignal }),
  }).then(({ ready }) => {
    if (!ready) {
      childProcess.kill('SIGKILL');
      throw new Error(
        `Dev server did not become ready within ${String(readinessTimeoutMs)}ms at ${pollUrl}`,
      );
    }
  });

  await Promise.race([readinessPoll, exitRace]);

  return { process: childProcess, url };
};
