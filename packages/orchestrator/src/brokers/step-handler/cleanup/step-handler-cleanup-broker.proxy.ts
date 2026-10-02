/**
 * PURPOSE: Proxy for stepHandlerCleanupBroker — mocks the child-process spawn boundary and
 * questCwdResolveBroker (its own dedicated test suite), matching the ward/riftcarver/commit handler
 * proxies' shape.
 *
 * Stages the handler's own spawn through `streamLinesProxy()` directly. The CLI is resolved from the
 * run root, so the spawn is `node <cli entry script> siegelense ...`; the args predicate (the
 * subcommand in the slot after the entry script) keeps it apart from ward's and riftcarver's spawns
 * on the same node when this proxy is composed alongside them (`stepHandlerRunBrokerProxy`).
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
import { packageBinResolveBrokerProxy } from '@dungeonmaster/shared/brokers/package-bin/resolve/package-bin-resolve-broker.proxy';
import type { Quest } from '@dungeonmaster/shared/contracts';
import type { CleanupCliAnswerStub } from '../../../contracts/cleanup-cli-answer/cleanup-cli-answer.stub';
import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { cleanupCliCallStatics } from '../../../statics/cleanup-cli-call/cleanup-cli-call-statics';

type CleanupCliAnswer = ReturnType<typeof CleanupCliAnswerStub>;
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

registerModuleMock({ module: '../../quest/cwd-resolve/quest-cwd-resolve-broker' });

const CLEANUP_COMMAND = cleanupCliCallStatics.call.bin;
const CLI_PACKAGE = '@dungeonmaster/cli';
const REPO_ROOT = '/repo';
const DEFAULT_CLI_MANIFEST = JSON.stringify({
  name: CLI_PACKAGE,
  bin: { [CLEANUP_COMMAND]: './dist/bin/dungeonmaster.js' },
});

export const stepHandlerCleanupBrokerProxy = (): {
  setupWorktreeMissing: (params: { questId: Quest['id']; worktreePath: string }) => void;
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
  cleanupExitsViaLocalCliInWorktree: (params: {
    questId: Quest['id'];
    worktreePath: string;
    exitCode: number;
    answer: CleanupCliAnswer;
    manifestJson: string;
  }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  questCwdResolveBrokerProxy();
  const cwdMock = registerMock({ fn: questCwdResolveBroker });

  RunNotFoundErrorProxy();
  getEnvProxy();
  const binProxy = packageBinResolveBrokerProxy();
  // `dirname` is mocked by a composed proxy (guildPathWalkUpLayerBrokerProxy), so the resolved
  // manifest's directory is staged by its own address and answered by the real implementation.
  const realPath = requireActual<{ dirname: typeof dirname }>({ module: 'path' });
  const dirnameHandle = registerMock({ fn: dirname });
  const cleanupSpawn = streamLinesProxy();
  const stageCleanup = ({
    repoRoot,
    manifestJson,
    exitCode,
    output,
  }: {
    repoRoot: string;
    manifestJson: string;
    exitCode: number;
    output: string;
  }): void => {
    const manifestPath = `${repoRoot}/node_modules/${CLI_PACKAGE}/package.json`;
    dirnameHandle.calledWith([manifestPath]).returns(realPath.dirname(manifestPath));
    binProxy.setupManifestInRunRoot({
      packageName: CLI_PACKAGE,
      repoRoot,
      manifestPath,
      rawManifest: manifestJson,
    });
    cleanupSpawn.setupSuccess({
      command: execPath,
      args: (args: readonly unknown[]): boolean => args[1] === cleanupCliCallStatics.call.args[0],
      exitCode,
      stdoutLines: output.split('\n').filter((entry) => entry.length > 0),
    });
  };
  const stageRepoRoot = ({ questId }: { questId: Quest['id'] }): void => {
    cwdMock
      .calledWith([{ questId }])
      .resolves(QuestCwdResolutionStub({ kind: 'worktree', cwd: REPO_ROOT }));
  };

  return {
    setupWorktreeMissing: ({
      questId,
      worktreePath,
    }: {
      questId: Quest['id'];
      worktreePath: string;
    }): void => {
      cwdMock
        .calledWith([{ questId }])
        .resolves(QuestCwdResolutionStub({ kind: 'missing-worktree', worktreePath }));
    },
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
      stageCleanup({
        repoRoot: REPO_ROOT,
        manifestJson: DEFAULT_CLI_MANIFEST,
        exitCode,
        output: JSON.stringify(answer),
      });
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
      stageCleanup({ repoRoot: REPO_ROOT, manifestJson: DEFAULT_CLI_MANIFEST, exitCode, output });
    },

    cleanupPrintsInvalidJson: ({ questId }: { questId: Quest['id'] }): void => {
      stageRepoRoot({ questId });
      stageCleanup({
        repoRoot: REPO_ROOT,
        manifestJson: DEFAULT_CLI_MANIFEST,
        exitCode: 0,
        output: 'not json',
      });
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
      stageCleanup({
        repoRoot: installedAt,
        manifestJson,
        exitCode,
        output: JSON.stringify(answer),
      });
    },

    cleanupExitsViaLocalCliInWorktree: ({
      questId,
      worktreePath,
      exitCode,
      answer,
      manifestJson,
    }: {
      questId: Quest['id'];
      worktreePath: string;
      exitCode: number;
      answer: CleanupCliAnswer;
      manifestJson: string;
    }): void => {
      cwdMock
        .calledWith([{ questId }])
        .resolves(QuestCwdResolutionStub({ kind: 'worktree', cwd: worktreePath }));
      stageCleanup({
        repoRoot: worktreePath,
        manifestJson,
        exitCode,
        output: JSON.stringify(answer),
      });
    },

    getSpawnedCommand: (): unknown => {
      const calls = cleanupSpawn.getOptionsFor({ command: execPath });
      return calls.length > 0 ? execPath : undefined;
    },

    getSpawnedArgs: (): unknown => cleanupSpawn.getSpawnedArgs({ command: execPath }),

    getSpawnedCwd: (): unknown => cleanupSpawn.getOptionsFor({ command: execPath }).at(-1)?.cwd,
  };
};
