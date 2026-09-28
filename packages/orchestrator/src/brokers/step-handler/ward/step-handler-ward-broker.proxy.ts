/**
 * PURPOSE: Proxy for stepHandlerWardBroker — mocks the child-process/fs/path gateway boundaries
 * plus three sibling brokers that each carry their own dedicated test suite
 * (questCwdResolveBroker, questFindQuestPathBroker, questModifyBroker), module-mocked directly
 * rather than driven through their own real logic. `join` (no dedicated proxy exists for it — see
 * `#gateway/node/path`'s own header) is left on a real passthrough — the ward-results write path
 * is computed for real and matched below rather than stubbed, which is what makes the detail-write
 * assertion meaningful.
 *
 * `streamLinesProxy` (composed inertly below, to satisfy `enforce-proxy-child-creation` for the
 * broker's `streamLines` import) addresses the underlying `spawn` by command alone and has no way
 * to read back `cwd` — unlike `runProxy`'s `getOptionsFor`, added in F29 for exactly this need — so
 * the mock below targets `streamLines` itself directly, the same boundary the pre-migration
 * adapter proxy staged, keyed the same way on a queue of runs (one ward invocation per
 * `wardExits*` call).
 *
 * USAGE:
 * const proxy = stepHandlerWardBrokerProxy();
 * proxy.setupWorktree({ worktreePath: '/repo/worktrees/add-auth' });
 * proxy.wardExits({ exitCode: ExitCodeStub({ value: 0 }), runId, detailJson: FileContentsStub() });
 * const result = await stepHandlerWardBroker({ args: [], questId, workItemId, onLine });
 */

import { streamLines } from '#gateway/node/child_process';
import { streamLinesProxy } from '#gateway/node/child_process/stream-lines/stream-lines.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { join } from '#gateway/node/path';
import {
  AbsoluteFilePathStub,
  ErrorMessageStub,
  FilePathStub,
  GuildIdStub,
  ModifyQuestResultStub,
  RepoRootCwdStub,
  type ErrorMessage,
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
// Matches stepHandlerWardBroker's own WARD_COMMAND constant — the address this proxy's spawn
// staging keys on, so it wins over a sibling handler proxy's unaddressed catch-all when both are
// composed together (stepHandlerRunBrokerProxy).
const WARD_COMMAND = 'dungeonmaster-ward';

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
  // Inert — this handler stages `streamLines` directly below (see the file header: its exact
  // output has to replay through the caller's onLine and its `cwd` has to be read back, neither of
  // which streamLinesProxy's own methods support), but the implementation imports `streamLines`
  // and `RunNotFoundError`, and the lint rule wants both composed.
  streamLinesProxy();
  RunNotFoundErrorProxy();

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

  const wardRuns: { exitCode: ExitCode; output: ErrorMessage }[] = [];
  const spawnHandle = registerMock({ fn: streamLines });
  const spawnImpl = async ({
    onLine,
  }: Parameters<typeof streamLines>[0]): Promise<{
    exitCode: ExitCode;
    output: ErrorMessage;
  }> => {
    const next = wardRuns.shift();
    if (next === undefined) {
      return Promise.reject(new Error('stepHandlerWardBrokerProxy: no ward spawn result queued'));
    }
    for (const line of String(next.output)
      .split('\n')
      .filter((entry) => entry.length > 0)) {
      onLine(line);
    }
    return Promise.resolve(next);
  };
  // Addressed by `command`, not an unaddressed `[]` catch-all: `stepHandlerRunBrokerProxy` composes
  // this proxy alongside riftcarver's (whose typecheck spawn shares this same adapter), and an
  // unaddressed sticky registration here would silently answer riftcarver's call too, or lose to
  // whichever proxy was constructed last. `{command: WARD_COMMAND}` is strictly more specific than
  // any `[]` staging, so it wins regardless of construction order.
  spawnHandle.calledWith([{ command: WARD_COMMAND }]).implement(spawnImpl as never);

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
      wardRuns.push({ exitCode, output: ErrorMessageStub({ value: `run: ${runId}\nlint: PASS` }) });
      detailProxy.setupSuccess({ output: String(detailJson) });
    },

    wardExitsWithoutRunId: ({ exitCode }: { exitCode: ExitCode }): void => {
      wardRuns.push({
        exitCode,
        output: ErrorMessageStub({
          value: 'ward: the file scope resolved to 0 source files, so NO checks ran',
        }),
      });
    },

    setupModifyFails: ({ error }: { error: string }): void => {
      modifyMock.calledWith([]).resolves(ModifyQuestResultStub({ success: false, error }));
    },

    getSpawnedWardArgs: (): unknown => {
      const [call] = spawnHandle.callsMatching([]);
      return (call?.[0] as Parameters<typeof streamLines>[0] | undefined)?.args;
    },

    getSpawnedWardCwd: (): unknown => {
      const [call] = spawnHandle.callsMatching([]);
      return (call?.[0] as Parameters<typeof streamLines>[0] | undefined)?.cwd;
    },
  };
};
