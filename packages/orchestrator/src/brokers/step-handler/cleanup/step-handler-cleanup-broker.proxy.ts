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
 * proxy.cleanupExits({ questId, exitCode: 0, answer: CleanupAnswerStub() });
 * const result = await stepHandlerCleanupBroker({ args: [], questId, workItemId, onLine: () => undefined });
 */

import { streamLinesProxy } from '#gateway/node/child_process/stream-lines/stream-lines.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { dirname } from '#gateway/node/path';
import { execPath } from '#gateway/node/process';
import type { Quest } from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import type { CleanupCliAnswer } from '../../../contracts/cleanup-cli-answer/cleanup-cli-answer-contract';
import { cleanupCliCallStatics } from '../../../statics/cleanup-cli-call/cleanup-cli-call-statics';
import { dungeonmasterBinResolveBrokerProxy } from '../../dungeonmaster-bin/resolve/dungeonmaster-bin-resolve-broker.proxy';
import { questRepoRootBroker } from '../../quest/repo-root/quest-repo-root-broker';
import { questRepoRootBrokerProxy } from '../../quest/repo-root/quest-repo-root-broker.proxy';

registerModuleMock({ module: '../../quest/repo-root/quest-repo-root-broker' });

const CLEANUP_COMMAND = cleanupCliCallStatics.call.bin;
const REPO_ROOT = '/repo';

export const stepHandlerCleanupBrokerProxy = (): {
  cleanupExits: (params: {
    questId: Quest['id'];
    exitCode: number;
    answer: CleanupCliAnswer;
  }) => void;
  cleanupFails: (params: { questId: Quest['id']; exitCode: number; output: string }) => void;
  cleanupPrintsInvalidJson: (params: { questId: Quest['id'] }) => void;
  cleanupExitsViaLocalCli: (params: {
    questId: Quest['id'];
    exitCode: number;
    answer: CleanupCliAnswer;
    installedAt: string;
    manifestJson: string;
  }) => void;
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
  const binProxy = dungeonmasterBinResolveBrokerProxy();
  // The resolve broker walks up from the run folder with `dirname`, which a composed proxy mocks
  // (guildPathWalkUpLayerBrokerProxy), so every level of that walk is staged by its own address.
  const realPath = requireActual<{ dirname: typeof dirname }>({ module: 'path' });
  const dirnameHandle = registerMock({ fn: dirname });
  const stageWalkUp = ({ dirPath }: { dirPath: string }): void => {
    const parent = realPath.dirname(dirPath);
    dirnameHandle.calledWith([dirPath]).returns(parent);
    if (parent !== dirPath) {
      stageWalkUp({ dirPath: parent });
    }
  };
  stageWalkUp({ dirPath: REPO_ROOT });
  const cleanupSpawn = streamLinesProxy();
  const runResult: { exitCode: number; output: string } = {
    exitCode: 0,
    output: '{}',
  };
  const spawned: { command: string } = { command: CLEANUP_COMMAND };
  const stageCleanupSpawn = (): void => {
    cleanupSpawn.setupSuccess({
      command: spawned.command,
      exitCode: runResult.exitCode,
      stdoutLines: runResult.output.split('\n').filter((entry) => entry.length > 0),
    });
  };
  stageCleanupSpawn();
  const stageRepoRoot = ({ questId }: { questId: Quest['id'] }): void => {
    repoRootMock.calledWith([{ questId }]).resolves(REPO_ROOT);
  };

  return {
    cleanupExits: ({
      questId,
      exitCode,
      answer,
    }: {
      questId: Quest['id'];
      exitCode: number;
      answer: CleanupCliAnswer;
    }): void => {
      stageRepoRoot({ questId });
      binProxy.setupNotInstalledAnywhere({ binName: CLEANUP_COMMAND });
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
      exitCode: number;
      output: string;
    }): void => {
      stageRepoRoot({ questId });
      binProxy.setupNotInstalledAnywhere({ binName: CLEANUP_COMMAND });
      runResult.exitCode = exitCode;
      runResult.output = output;
      stageCleanupSpawn();
    },

    cleanupPrintsInvalidJson: ({ questId }: { questId: Quest['id'] }): void => {
      stageRepoRoot({ questId });
      binProxy.setupNotInstalledAnywhere({ binName: CLEANUP_COMMAND });
      runResult.exitCode = 0;
      runResult.output = 'not json';
      stageCleanupSpawn();
    },

    cleanupExitsViaLocalCli: ({
      questId,
      exitCode,
      answer,
      installedAt,
      manifestJson,
    }: {
      questId: Quest['id'];
      exitCode: number;
      answer: CleanupCliAnswer;
      installedAt: string;
      manifestJson: string;
    }): void => {
      stageRepoRoot({ questId });
      binProxy.setupInstalled({
        cwd: REPO_ROOT,
        binName: CLEANUP_COMMAND,
        installedAt,
        manifestJson,
      });
      spawned.command = execPath;
      runResult.exitCode = exitCode;
      runResult.output = JSON.stringify(answer);
      stageCleanupSpawn();
    },

    getSpawnedCommand: (): unknown => {
      const calls = cleanupSpawn.getOptionsFor({ command: spawned.command });
      return calls.length > 0 ? spawned.command : undefined;
    },

    getSpawnedArgs: (): unknown => cleanupSpawn.getSpawnedArgs({ command: spawned.command }),

    getSpawnedCwd: (): unknown =>
      cleanupSpawn.getOptionsFor({ command: spawned.command }).at(-1)?.cwd,
  };
};
