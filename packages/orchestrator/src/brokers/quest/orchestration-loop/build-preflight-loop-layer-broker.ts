/**
 * PURPOSE: Recursive build preflight loop — attempts build up to maxAttempts, spawning a
 * spiritmender to fix errors between attempts.
 *
 * USAGE:
 * const result = await buildPreflightLoopLayerBroker({ buildCommand, cwd, startPath, abortSignal, attempt: 0, maxAttempts: 3 });
 * // Returns { success: true } if build passes within the attempt limit.
 * // Returns { success: false } if all attempts are exhausted.
 */

import { errorMessageContract, type FilePath, type GuildId } from '@dungeonmaster/shared/contracts';

import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { spiritmenderContextStatics } from '../../../statics/spiritmender-context/spiritmender-context-statics';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { buildPreflightBroker } from '../../build/preflight/build-preflight-broker';
import { agentSpawnByRoleBroker } from '../../agent/spawn-by-role/agent-spawn-by-role-broker';

export const buildPreflightLoopLayerBroker = async ({
  buildCommand,
  cwd,
  startPath,
  guildId,
  abortSignal,
  attempt,
  maxAttempts,
}: {
  buildCommand: string;
  cwd: AbsoluteFilePath;
  startPath: FilePath;
  guildId: GuildId;
  abortSignal: AbortSignal;
  attempt: number;
  maxAttempts: number;
}): Promise<{ success: boolean }> => {
  if (abortSignal.aborted) {
    return { success: false };
  }

  const buildResult = await buildPreflightBroker({ buildCommand, cwd });

  if (buildResult.success) {
    return { success: true };
  }

  const nextAttempt = attempt + 1;

  if (nextAttempt >= maxAttempts) {
    return { success: false };
  }

  const buildOutputLines = buildResult.output.split('\n').filter(Boolean);
  const spiritmenderWorkUnit = workUnitContract.parse({
    role: 'spiritmender',
    filePaths: [],
    errors: buildOutputLines.map((line) => errorMessageContract.parse(line)),
    verificationCommand: buildCommand,
    contextInstructions: spiritmenderContextStatics.buildFailure.instructions,
  });

  await agentSpawnByRoleBroker({
    workUnit: spiritmenderWorkUnit,
    startPath,
    guildId,
    abortSignal,
  });

  return buildPreflightLoopLayerBroker({
    buildCommand,
    cwd,
    startPath,
    guildId,
    abortSignal,
    attempt: nextAttempt,
    maxAttempts,
  });
};
