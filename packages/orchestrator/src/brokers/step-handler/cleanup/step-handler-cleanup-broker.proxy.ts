/**
 * PURPOSE: Proxy for stepHandlerCleanupBroker — mocks the child-process spawn boundary and
 * questRepoRootBroker (its own dedicated test suite), matching the ward/riftcarver/commit handler
 * proxies' shape.
 *
 * Stages the handler's own spawn through `streamLinesProxy()` directly, addressed by `command`
 * alone: `cleanupCliCallStatics.call.bin` (`'dungeonmaster'`) never collides with `WARD_COMMAND`
 * (`'dungeonmaster-ward'`), so no `args`/`cwd` refinement is needed here even when this proxy is
 * composed alongside ward's and riftcarver's (`stepHandlerRunBrokerProxy`).
 *
 * USAGE:
 * const proxy = stepHandlerCleanupBrokerProxy();
 * proxy.cleanupExits({ questId, exitCode: ExitCodeStub({ value: 0 }), answer: CleanupAnswerStub() });
 * const result = await stepHandlerCleanupBroker({ args: [], questId, workItemId, onLine: () => undefined });
 */

import { streamLinesProxy } from '#gateway/node/child_process/stream-lines/stream-lines.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import type { ExitCode, Quest } from '@dungeonmaster/shared/contracts';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts/exit-code/exit-code.stub';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import type { CleanupCliAnswer } from '../../../contracts/cleanup-answer/cleanup-answer-contract';
import { cleanupCliCallStatics } from '../../../statics/cleanup-cli-call/cleanup-cli-call-statics';
import { questRepoRootBroker } from '../../quest/repo-root/quest-repo-root-broker';
import { questRepoRootBrokerProxy } from '../../quest/repo-root/quest-repo-root-broker.proxy';

registerModuleMock({ module: '../../quest/repo-root/quest-repo-root-broker' });

const CLEANUP_COMMAND = cleanupCliCallStatics.call.bin;

export const stepHandlerCleanupBrokerProxy = (): {
  cleanupExits: (params: { questId: Quest['id']; exitCode: ExitCode; answer: CleanupCliAnswer }) => void;
  cleanupFails: (params: { questId: Quest['id']; exitCode: ExitCode; output: string }) => void;
  cleanupPrintsInvalidJson: (params: { questId: Quest['id'] }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  // Inert — satisfies enforce-proxy-child-creation. The module mock above replaces
  // questRepoRootBroker's export; this proxy's own internal staging is never exercised.
  questRepoRootBrokerProxy();
  const repoRootMock = registerMock({ fn: questRepoRootBroker });

  RunNotFoundErrorProxy();
  getEnvProxy();
  const cleanupSpawn = streamLinesProxy();
  const runResult: { exitCode: ExitCode; output: string } = {
    exitCode: ExitCodeStub({ value: 0 }),
    output: '{}',
  };
  const stageCleanupSpawn = (): void => {
    cleanupSpawn.setupSuccess({
      command: CLEANUP_COMMAND,
      exitCode: Number(runResult.exitCode),
      stdoutLines: String(runResult.output)
        .split('\n')
        .filter((entry) => entry.length > 0),
    });
  };
  stageCleanupSpawn();
  const stageRepoRoot = ({ questId }: { questId: Quest['id'] }): void => {
    repoRootMock.calledWith([{ questId }]).resolves('/repo');
  };

  return {
    cleanupExits: ({
      questId,
      exitCode,
      answer,
    }: {
      questId: Quest['id'];
      exitCode: ExitCode;
      answer: CleanupCliAnswer;
    }): void => {
      stageRepoRoot({ questId });
      runResult.exitCode = exitCode;
      runResult.output = JSON.stringify(answer);
      stageCleanupSpawn();
    },

    cleanupFails: ({
      questId,
      exitCode,
      output,
    }: {
      questId: Quest['id'];
      exitCode: ExitCode;
      output: string;
    }): void => {
      stageRepoRoot({ questId });
      runResult.exitCode = exitCode;
      runResult.output = output;
      stageCleanupSpawn();
    },

    cleanupPrintsInvalidJson: ({ questId }: { questId: Quest['id'] }): void => {
      stageRepoRoot({ questId });
      runResult.exitCode = ExitCodeStub({ value: 0 });
      runResult.output = 'not json';
      stageCleanupSpawn();
    },

    getSpawnedCommand: (): unknown => {
      const calls = cleanupSpawn.getOptionsFor({ command: CLEANUP_COMMAND });
      return calls.length > 0 ? CLEANUP_COMMAND : undefined;
    },

    getSpawnedArgs: (): unknown => cleanupSpawn.getSpawnedArgs({ command: CLEANUP_COMMAND }),

    getSpawnedCwd: (): unknown =>
      cleanupSpawn.getOptionsFor({ command: CLEANUP_COMMAND }).at(-1)?.cwd,
  };
};
