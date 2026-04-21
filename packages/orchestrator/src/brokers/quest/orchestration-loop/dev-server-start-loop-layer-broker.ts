/**
 * PURPOSE: Recursive dev server start loop — attempts to start the dev server up to maxAttempts,
 * spawning a spiritmender to fix errors between attempts.
 *
 * USAGE:
 * const result = await devServerStartLoopLayerBroker({ devCommand, port, hostname, readinessPath, readinessTimeoutMs, cwd, startPath, abortSignal, attempt: 0, maxAttempts: 3 });
 * // Returns { success: true, process } if server starts within the attempt limit.
 * // Returns { success: false } if all attempts are exhausted.
 */

import { errorMessageContract, type FilePath } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { spiritmenderContextStatics } from '../../../statics/spiritmender-context/spiritmender-context-statics';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';
import { devServerStartBroker } from '../../dev-server/start/dev-server-start-broker';

type DevServerProcess = Awaited<ReturnType<typeof devServerStartBroker>>['process'];

export const devServerStartLoopLayerBroker = async ({
  devCommand,
  port,
  hostname,
  readinessPath,
  readinessTimeoutMs,
  cwd,
  startPath,
  abortSignal,
  attempt,
  maxAttempts,
}: {
  devCommand: string;
  port: number;
  hostname: string;
  readinessPath: string;
  readinessTimeoutMs: number;
  cwd: AbsoluteFilePath;
  startPath: FilePath;
  abortSignal: AbortSignal;
  attempt: number;
  maxAttempts: number;
}): Promise<{ success: true; process: DevServerProcess } | { success: false }> => {
  if (abortSignal.aborted) {
    return { success: false };
  }

  try {
    const serverResult = await devServerStartBroker({
      devCommand,
      port,
      hostname,
      readinessPath,
      readinessTimeoutMs,
      cwd,
      abortSignal,
    });
    return { success: true, process: serverResult.process };
  } catch (error: unknown) {
    const nextAttempt = attempt + 1;
    const errorText = error instanceof Error ? error.message : String(error);

    if (nextAttempt >= maxAttempts) {
      process.stderr.write(
        `[dev-server-start] exhausted ${String(maxAttempts)} attempts on ${hostname}:${String(port)}${readinessPath} (readinessTimeoutMs=${String(readinessTimeoutMs)}); last error: ${errorText}\n`,
      );
      return { success: false };
    }

    process.stderr.write(
      `[dev-server-start] attempt ${String(nextAttempt)} of ${String(maxAttempts)} failed on ${hostname}:${String(port)}${readinessPath}: ${errorText}\n`,
    );

    const spiritmenderWorkUnit = workUnitContract.parse({
      role: 'spiritmender',
      filePaths: [],
      errors: [errorMessageContract.parse(String(error))],
      verificationCommand: devCommand,
      contextInstructions: spiritmenderContextStatics.devServerStartFailure.instructions,
    });

    await agentSpawnByRoleBroker({
      workUnit: spiritmenderWorkUnit,
      startPath,
      abortSignal,
    });

    return devServerStartLoopLayerBroker({
      devCommand,
      port,
      hostname,
      readinessPath,
      readinessTimeoutMs,
      cwd,
      startPath,
      abortSignal,
      attempt: nextAttempt,
      maxAttempts,
    });
  }
};
