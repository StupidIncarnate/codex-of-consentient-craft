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
 * proxy.setupWorktree({ worktreePath: '/repo/worktrees/add-auth' });
 * proxy.wardExits({ exitCode: ExitCodeStub({ value: 0 }), runId, detailJson: FileContentsStub() });
 * const result = await stepHandlerWardBroker({ args: [], questId, workItemId, onLine });
 */

import { streamLinesProxy } from '#gateway/node/child_process/stream-lines/stream-lines.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { join } from '#gateway/node/path';
import {
  AbsoluteFilePathStub,
  FilePathStub,
  GuildIdStub,
  ModifyQuestResultStub,
  RepoRootCwdStub,
  type ExitCode,
  type FileContents,
  type FileName,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
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

const QUEST_PATH = FilePathStub({
  value: '/home/testuser/.dungeonmaster/guilds/g1/quests/add-auth',
});
const FIXED_WARD_RESULT_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0f0';
// Match stepHandlerWardBroker's own WARD_COMMAND/RUN_SUBCOMMAND constants — RUN_SUBCOMMAND is what
// the args predicate below keys on to stage this handler's own spawn apart from
// wardDetailBrokerProxy's `run` call for the same WARD_COMMAND (args `['detail', ...]`).
const WARD_COMMAND = 'dungeonmaster-ward';
const RUN_SUBCOMMAND = 'run';

export const stepHandlerWardBrokerProxy = (): {
  setupWorktree: (params: { worktreePath: string }) => void;
  setupWorktreeMissing: (params: { worktreePath: string }) => void;
  wardExits: (params: { exitCode: ExitCode; runId: FileName; detailJson: FileContents }) => void;
  wardExitsWithoutRunId: (params: { exitCode: ExitCode }) => void;
  setupModifyFails: (params: { error: string }) => void;
  getSpawnedWardArgs: () => unknown;
  getSpawnedWardCwd: () => unknown;
} => {
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
  const fsWriteProxy = fsWriteFileAdapterProxy();
  fsWriteProxy.succeeds({
    filePath: FilePathStub({
      value: `${QUEST_PATH}/${locationsStatics.quest.wardResultsDir}/${FIXED_WARD_RESULT_UUID}.json`,
    }),
  });
  const detailProxy = wardDetailBrokerProxy();
  // Inert — satisfies enforce-proxy-child-creation. The module mocks below replace both brokers'
  // exports; this proxy's own internal staging is never exercised.
  questCwdResolveBrokerProxy();
  questFindQuestPathBrokerProxy();
  // Also inert for the same reason: questModifyBrokerProxy module-mocks questModifyBroker itself
  // and defaults it to a real-implementation passthrough. The direct staging below (same `[]`
  // address, registered after) overrides that default for this handler's purposes.
  questModifyBrokerProxy();
  RunNotFoundErrorProxy();
  const wardSpawn = streamLinesProxy();

  const cwdMock = registerMock({ fn: questCwdResolveBroker });
  cwdMock.calledWith([]).resolves(
    QuestCwdResolutionStub({
      kind: 'worktree',
      cwd: RepoRootCwdStub({ value: '/repo/worktrees/add-auth' }),
    }),
  );

  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  findQuestPathMock.calledWith([]).resolves({ questPath: QUEST_PATH, guildId: GuildIdStub() });

  const modifyMock = registerMock({ fn: questModifyBroker });
  modifyMock.calledWith([]).resolves(ModifyQuestResultStub({ success: true }));

  registerSpyOn({ object: crypto, method: 'randomUUID' })
    .calledWith([])
    .returns(FIXED_WARD_RESULT_UUID as ReturnType<typeof crypto.randomUUID>);
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  // The args predicate matches only a `run`-subcommand spawn on WARD_COMMAND, so this stage never
  // answers wardDetailBrokerProxy's own `run` call (args `['detail', ...]`) for the same command —
  // see the file header.
  const isRunSubcommand = (value: readonly unknown[]): boolean => value[0] === RUN_SUBCOMMAND;

  return {
    setupWorktree: ({ worktreePath }: { worktreePath: string }): void => {
      cwdMock.calledWith([]).resolves(
        QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: RepoRootCwdStub({ value: worktreePath }),
        }),
      );
    },

    setupWorktreeMissing: ({ worktreePath }: { worktreePath: string }): void => {
      cwdMock.calledWith([]).resolves(
        QuestCwdResolutionStub({
          kind: 'missing-worktree',
          worktreePath: AbsoluteFilePathStub({ value: worktreePath }),
        }),
      );
    },

    wardExits: ({
      exitCode,
      runId,
      detailJson,
    }: {
      exitCode: ExitCode;
      runId: FileName;
      detailJson: FileContents;
    }): void => {
      wardSpawn.setupSuccess({
        command: WARD_COMMAND,
        args: isRunSubcommand,
        exitCode: Number(exitCode),
        stdoutLines: [`run: ${String(runId)}`, 'lint: PASS'],
      });
      detailProxy.setupSuccess({ output: String(detailJson) });
    },

    wardExitsWithoutRunId: ({ exitCode }: { exitCode: ExitCode }): void => {
      wardSpawn.setupSuccess({
        command: WARD_COMMAND,
        args: isRunSubcommand,
        exitCode: Number(exitCode),
        stdoutLines: ['ward: the file scope resolved to 0 source files, so NO checks ran'],
      });
    },

    setupModifyFails: ({ error }: { error: string }): void => {
      modifyMock.calledWith([]).resolves(ModifyQuestResultStub({ success: false, error }));
    },

    getSpawnedWardArgs: (): unknown => wardSpawn.getSpawnedArgs({ command: WARD_COMMAND }),

    getSpawnedWardCwd: (): unknown =>
      wardSpawn.getOptionsFor({ command: WARD_COMMAND }).at(-1)?.cwd,
  };
};
