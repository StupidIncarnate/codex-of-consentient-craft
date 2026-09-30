/**
 * PURPOSE: Proxy for stepHandlerWardBroker — mocks the child-process/fs/path gateway boundaries
 * plus three sibling brokers that each carry their own dedicated test suite
 * (questCwdResolveBroker, questFindQuestPathBroker, questModifyBroker), module-mocked directly
 * rather than driven through their own real logic. `join` (no dedicated proxy exists for it — see
 * `#gateway/node/path`'s own header) is left on a real passthrough — the ward-results write path
 * is computed for real and matched below rather than stubbed, which is what makes the detail-write
 * assertion meaningful.
 *
 * `streamLinesProxy().setupSuccess` now addresses by `command` AND `args` (F51 gave it the same
 * `args`/`cwd` refinement `runProxy` already had), so this handler's own spawn — args
 * `[RUN_SUBCOMMAND, ...]` — stages apart from `wardDetailBrokerProxy`'s `run` call for the SAME
 * `WARD_COMMAND` with args `['detail', ...]`: both reduce to the one shared raw `spawn` mock, and
 * the args predicate below matches only a `run`-subcommand call, leaving `wardDetailBrokerProxy`'s
 * own `{command: WARD_COMMAND}` (no args) stage to answer the `detail` call by elimination.
 *
 * USAGE:
 * const proxy = stepHandlerWardBrokerProxy();
 * proxy.wardExits({ questId, exitCode: ExitCodeStub({ value: 0 }), runId, detailJson: FileContentsStub() });
 * const result = await stepHandlerWardBroker({ args: [], questId, workItemId, onLine });
 */

import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { randomUUID } from '#gateway/node/crypto';
import { streamLinesProxy } from '#gateway/node/child_process/stream-lines/stream-lines.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { join } from '#gateway/node/path';
import type { ExitCode, FileName, Quest } from '@dungeonmaster/shared/contracts';
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
const RUN_SUBCOMMAND = 'run';
const DEFAULT_WORKTREE_PATH = '/repo/worktrees/add-auth';

export const stepHandlerWardBrokerProxy = (): {
  setupWorktreeMissing: (params: { questId: Quest['id']; worktreePath: string }) => void;
  wardExits: (params: {
    questId: Quest['id'];
    exitCode: ExitCode;
    runId: FileName;
    detailJson: string;
  }) => void;
  wardExitsWithoutRunId: (params: { questId: Quest['id']; exitCode: ExitCode }) => void;
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

  const cwdMock = registerMock({ fn: questCwdResolveBroker });
  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const modifyMock = registerMock({ fn: questModifyBroker });

  registerMock({ fn: randomUUID })
    .calledWith([])
    .returns(FIXED_WARD_RESULT_UUID as ReturnType<typeof randomUUID>);
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  // The args predicate matches only a `run`-subcommand spawn on WARD_COMMAND, so this stage never
  // answers wardDetailBrokerProxy's own `run` call (args `['detail', ...]`) for the same command —
  // see the file header.
  const isRunSubcommand = (value: readonly unknown[]): boolean => value[0] === RUN_SUBCOMMAND;

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
          worktreePath: worktreePath,
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
      exitCode: ExitCode;
      runId: FileName;
      detailJson: string;
    }): void => {
      stageQuest({ questId });
      wardSpawn.setupSuccess({
        command: WARD_COMMAND,
        args: isRunSubcommand,
        exitCode: Number(exitCode),
        stdoutLines: [`run: ${String(runId)}`, 'lint: PASS'],
      });
      detailProxy.setupSuccess({ output: String(detailJson) });
    },

    wardExitsWithoutRunId: ({
      questId,
      exitCode,
    }: {
      questId: Quest['id'];
      exitCode: ExitCode;
    }): void => {
      stageQuest({ questId });
      wardSpawn.setupSuccess({
        command: WARD_COMMAND,
        args: isRunSubcommand,
        exitCode: Number(exitCode),
        stdoutLines: ['ward: the file scope resolved to 0 source files, so NO checks ran'],
      });
    },

    getSpawnedWardArgs: (): unknown => wardSpawn.getSpawnedArgs({ command: WARD_COMMAND }),

    getSpawnedWardCwd: (): unknown =>
      wardSpawn.getOptionsFor({ command: WARD_COMMAND }).at(-1)?.cwd,
  };
};
