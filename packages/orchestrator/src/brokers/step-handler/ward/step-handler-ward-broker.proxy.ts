/**
 * PURPOSE: Proxy for stepHandlerWardBroker — mocks the child-process/fs/path gateway boundaries
 * plus three sibling brokers that each carry their own dedicated test suite
 * (questCwdResolveBroker, questFindQuestPathBroker, questModifyBroker), module-mocked directly
 * rather than driven through their own real logic. `join` (no dedicated proxy exists for it — see
 * `#gateway/node/path`'s own header) is left on a real passthrough — the ward-results write path
 * is computed for real and matched below rather than stubbed, which is what makes the detail-write
 * assertion meaningful.
 *
 * The ward is resolved from the quest worktree, so every spawn is `node <entry script> ...`.
 * `streamLinesProxy().setupSuccess` addresses by `command` AND `args`, so this handler's own spawn —
 * the entry script then `RUN_SUBCOMMAND` — stages apart from `wardDetailBrokerProxy`'s `run` call on
 * the same node, whose args carry `detail` in that slot: both reduce to the one shared raw `spawn`
 * mock, and each args predicate matches only its own subcommand.
 *
 * USAGE:
 * const proxy = stepHandlerWardBrokerProxy();
 * proxy.wardExits({ questId, exitCode: 0, runId, detailJson: 'test file contents' });
 * const result = await stepHandlerWardBroker({ args: [], questId, workItemId, onLine });
 */

import { execPath } from '#gateway/node/process';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { randomUUID } from '#gateway/node/crypto';
import { streamLinesProxy } from '#gateway/node/child_process/stream-lines/stream-lines.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { join } from '#gateway/node/path';
import type { Quest } from '@dungeonmaster/shared/contracts';
import { packageBinResolveBrokerProxy } from '@dungeonmaster/shared/brokers/package-bin/resolve/package-bin-resolve-broker.proxy';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts/modify-quest-result/modify-quest-result.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { wardDetailBrokerProxy } from '../../ward/detail/ward-detail-broker.proxy';
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questModifyBroker } from '../../quest/modify/quest-modify-broker';
import { questModifyBrokerProxy } from '../../quest/modify/quest-modify-broker.proxy';

registerModuleMock({ module: '../../quest/cwd-resolve/quest-cwd-resolve-broker' });
registerModuleMock({ module: '../../quest/find-quest-path/quest-find-quest-path-broker' });

const QUEST_PATH = '/home/testuser/.dungeonmaster/guilds/g1/quests/add-auth';
const FIXED_WARD_RESULT_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0f0';
// Match stepHandlerWardBroker's own WARD_COMMAND/RUN_SUBCOMMAND constants — RUN_SUBCOMMAND is what
// the args predicate below keys on to stage this handler's own spawn apart from
// wardDetailBrokerProxy's `run` call for the same WARD_COMMAND (args `['detail', ...]`).
const WARD_COMMAND = 'dungeonmaster-ward';
const WARD_PACKAGE = '@dungeonmaster/ward';
const RUN_SUBCOMMAND = 'run';
const DEFAULT_WORKTREE_PATH = '/repo/worktrees/add-auth';
const DEFAULT_WARD_MANIFEST = JSON.stringify({
  bin: { [WARD_COMMAND]: './dist/bin/ward-entry.js' },
});

export const stepHandlerWardBrokerProxy = (): {
  setupWorktreeMissing: (params: { questId: Quest['id']; worktreePath: string }) => void;
  wardExits: (params: {
    questId: Quest['id'];
    exitCode: number;
    runId: string;
    detailJson: string;
  }) => void;
  wardExitsWithoutRunId: (params: { questId: Quest['id']; exitCode: number }) => void;
  getWrittenOutputLog: () => unknown;
  getSpawnedWardArgs: () => unknown;
  getSpawnedWardCwd: () => unknown;
} => {
  getEnvProxy();
  // `join` has no dedicated proxy (a plain pass-through re-export — see `#gateway/node/path`'s own
  // header), so this stages a real passthrough directly: the ward-results write path is computed
  // for real below rather than stubbed, which is what makes the detail-write assertion meaningful.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  const fsMkdirProxy = ensureDirProxy();
  fsMkdirProxy.succeeds({
    path: `${QUEST_PATH}/${locationsStatics.quest.wardResultsDir}`,
  });
  const fsWriteProxy = writeFileProxy();
  fsWriteProxy.succeeds({
    path: `${QUEST_PATH}/${locationsStatics.quest.wardResultsDir}/${FIXED_WARD_RESULT_UUID}.json`,
  });
  const outputLogPath = `${QUEST_PATH}/${locationsStatics.quest.wardResultsDir}/${FIXED_WARD_RESULT_UUID}.log`;
  fsWriteProxy.succeeds({ path: outputLogPath });
  const detailProxy = wardDetailBrokerProxy();
  // Inert — satisfies enforce-proxy-child-creation. The module mocks below replace both brokers'
  // exports; this proxy's own internal staging is never exercised.
  questCwdResolveBrokerProxy();
  questFindQuestPathBrokerProxy();
  // Also inert for the same reason: questModifyBrokerProxy module-mocks questModifyBroker itself
  // and defaults it to a real-implementation passthrough. The direct staging below, addressed by
  // the quest's own id and registered after, overrides that default for this handler's purposes.
  questModifyBrokerProxy();
  RunNotFoundErrorProxy();
  const wardSpawn = streamLinesProxy();
  // The resolver reads the same manifest `wardDetailBrokerProxy`'s own composed resolver stages;
  // both stagings carry the identical address and answer, so the second re-registers an equal one.
  const binProxy = packageBinResolveBrokerProxy();

  const cwdMock = registerMock({ fn: questCwdResolveBroker });
  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const modifyMock = registerMock({ fn: questModifyBroker });

  registerMock({ fn: randomUUID })
    .calledWith([])
    .returns(FIXED_WARD_RESULT_UUID as ReturnType<typeof randomUUID>);
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  // The args predicate matches only a `run`-subcommand spawn (the slot after the entry script), so
  // this stage never answers wardDetailBrokerProxy's own `detail` call — see the file header.
  const isRunSubcommand = (value: readonly unknown[]): boolean => value[1] === RUN_SUBCOMMAND;

  const stageWard = ({
    exitCode,
    stdoutLines,
    manifestJson,
  }: {
    exitCode: number;
    stdoutLines: string[];
    manifestJson: string;
  }): void => {
    binProxy.setupManifestInRunRoot({
      packageName: WARD_PACKAGE,
      repoRoot: DEFAULT_WORKTREE_PATH,
      manifestPath: `${DEFAULT_WORKTREE_PATH}/node_modules/${WARD_PACKAGE}/package.json`,
      rawManifest: manifestJson,
    });
    wardSpawn.setupSuccess({
      command: execPath,
      args: isRunSubcommand,
      cwd: DEFAULT_WORKTREE_PATH,
      exitCode,
      stdoutLines,
    });
  };

  // The quest-scoped answers every ward run reads: its worktree, its folder, and the write of its
  // ward result, each addressed by the arguments `stepHandlerWardBroker` passes for that quest.
  const stageQuest = ({ questId }: { questId: Quest['id'] }): void => {
    cwdMock.calledWith([{ questId }]).resolves(
      QuestCwdResolutionStub({
        kind: 'worktree',
        cwd: DEFAULT_WORKTREE_PATH,
      }),
    );
    findQuestPathMock
      .calledWith([{ questId }])
      .resolves({ questPath: QUEST_PATH, guildId: GuildIdStub() });
    modifyMock
      .calledWith([{ input: { questId } }])
      .resolves(ModifyQuestResultStub({ success: true }));
  };

  return {
    setupWorktreeMissing: ({
      questId,
      worktreePath,
    }: {
      questId: Quest['id'];
      worktreePath: string;
    }): void => {
      cwdMock.calledWith([{ questId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'missing-worktree',
          worktreePath,
        }),
      );
    },

    wardExits: ({
      questId,
      exitCode,
      runId,
      detailJson,
    }: {
      questId: Quest['id'];
      exitCode: number;
      runId: string;
      detailJson: string;
    }): void => {
      stageQuest({ questId });
      stageWard({
        exitCode,
        stdoutLines: [`run: ${runId}`, 'lint: PASS'],
        manifestJson: DEFAULT_WARD_MANIFEST,
      });
      detailProxy.setupSuccess({ startPath: DEFAULT_WORKTREE_PATH, output: detailJson });
    },

    wardExitsWithoutRunId: ({
      questId,
      exitCode,
    }: {
      questId: Quest['id'];
      exitCode: number;
    }): void => {
      stageQuest({ questId });
      stageWard({
        exitCode,
        stdoutLines: ['ward: the file scope resolved to 0 source files, so NO checks ran'],
        manifestJson: DEFAULT_WARD_MANIFEST,
      });
    },

    getWrittenOutputLog: (): unknown => fsWriteProxy.writtenContentsFor({ path: outputLogPath }),

    getSpawnedWardArgs: (): unknown => wardSpawn.getSpawnedArgs({ command: execPath }),

    getSpawnedWardCwd: (): unknown => wardSpawn.getOptionsFor({ command: execPath }).at(-1)?.cwd,
  };
};
