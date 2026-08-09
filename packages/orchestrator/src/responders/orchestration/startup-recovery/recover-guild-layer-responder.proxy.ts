/**
 * PURPOSE: Proxy for RecoverGuildLayerResponder that mocks filesystem, state, and orchestration dependencies
 *
 * USAGE:
 * const proxy = RecoverGuildLayerResponderProxy();
 * proxy.setupGuildWithQuests({guildId, guildPath, quests});
 * await RecoverGuildLayerResponder({guildItem});
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { FilePathStub, GuildStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  GuildId,
  GuildPath,
  ProcessId,
  QuestBranchName,
  QuestId,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { questCwdResolveBroker } from '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker';
import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questListBrokerProxy } from '../../../brokers/quest/list/quest-list-broker.proxy';
import { questLoadBroker } from '../../../brokers/quest/load/quest-load-broker';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { questOrchestrationLoopBrokerProxy } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy';
import { questPersistBroker } from '../../../brokers/quest/persist/quest-persist-broker';
import { worktreeResumeRestoreBroker } from '../../../brokers/worktree/resume-restore/worktree-resume-restore-broker';
import { worktreeResumeRestoreBrokerProxy } from '../../../brokers/worktree/resume-restore/worktree-resume-restore-broker.proxy';
import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

// questModifyBroker's own real body (left running for real below, so the reset transform +
// persist are actually proven) calls questFindQuestPathBroker, questLoadBroker, and
// questPersistBroker directly. All three sit under brokers/quest/**, where a sibling change
// unconditionally registerMock's dungeonmasterHomeFindBroker in quest-find-quest-path-broker's
// own constructor — once that bypasses dungeonmasterHomeFindBroker with a sticky mock, EVERY
// one of these three brokers' own onceFor-staged fs/path chains (built through
// dungeonmasterHomeFindBrokerProxy().setupHomePath()) goes permanently unconsumed and shifts
// onto whatever real fs/path call runs next. Addressing each of the three directly by its real
// argument sidesteps that chain instead of depending on it. questBlockOnFailureBroker (called
// for a missing-worktree quest) composes the SAME chain for real — it needs no mock of its own.
registerModuleMock({
  module: '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker',
});
registerModuleMock({ module: '../../../brokers/quest/load/quest-load-broker' });
registerModuleMock({ module: '../../../brokers/quest/persist/quest-persist-broker' });
// questCwdResolveBroker has its own dedicated fs-backed test suite. Re-deriving realistic fs
// state for it here collides with the shared quest-file mocks above the moment a test seeds more
// than one quest sharing the default folder — addressing this mock by questId sidesteps that,
// mirroring scan-once-layer-broker.proxy.ts.
registerModuleMock({ module: '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker' });
// worktreeResumeRestoreBroker's own real body still runs below (composed through the spawn-level
// proxy underneath) — this wrapper exists only to capture the exact {worktreePath, branchName}
// this responder passed, since the broker exposes no call-args getter of its own (unlike its
// spawn-level getSpawnedArgsList()).
registerModuleMock({
  module: '../../../brokers/worktree/resume-restore/worktree-resume-restore-broker',
});

type Quest = ReturnType<typeof QuestStub>;

export const RecoverGuildLayerResponderProxy = (): {
  setupGuildWithQuests: (params: {
    guildId: GuildId;
    guildPath: GuildPath;
    quests: Quest[];
  }) => void;
  setupGuildWithExistingProcess: (params: {
    guildId: GuildId;
    guildPath: GuildPath;
    quests: Quest[];
    existingProcessQuestId: QuestId;
  }) => void;
  setupGuildDirectoryReadFailure: (params: { error: Error }) => void;
  setupWorktreeMissing: (params: { quest: Quest; worktreePath: AbsoluteFilePath }) => void;
  setupWorktreeDrifted: (params: {
    quest: Quest;
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    currentBranchName: string;
  }) => void;
  getRegisteredProcessIds: () => readonly ProcessId[];
  getAllPersistedContents: () => readonly unknown[];
  getRestoreSpawnedArgs: () => readonly unknown[];
  getWorktreeRestoreCalls: () => readonly unknown[];
} => {
  const guildGetProxy = guildGetBrokerProxy();
  const questListProxy = questListBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; questModifyBroker itself still runs for
  // real below (only its findQuestPath/load/persist dependencies are bypassed directly).
  questModifyBrokerProxy();
  questOrchestrationLoopBrokerProxy();
  orchestrationEventsStateProxy();
  const stateProxy = orchestrationProcessesStateProxy();
  stateProxy.setupEmpty();
  const worktreeRestoreProxy = worktreeResumeRestoreBrokerProxy();

  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const loadMock = registerMock({ fn: questLoadBroker });
  const persistMock = registerMock({ fn: questPersistBroker });
  const cwdResolveMock = registerMock({ fn: questCwdResolveBroker });
  const worktreeRestoreMock = registerMock({ fn: worktreeResumeRestoreBroker });

  // dungeonmasterHomeFindBroker() takes no arguments. Nothing in this proxy's own real
  // execution reaches it any more (guildGetProxy/questListProxy/the three mocks above are all
  // addressed directly), but it stays wrapped-and-unstaged for the whole test file the moment
  // quest-find-quest-path-broker.proxy.ts's module loads — this is a defensive backstop in
  // case any future real call reaches it.
  registerMock({ fn: dungeonmasterHomeFindBroker })
    .calledWith([])
    .returns({ homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }) });

  registerSpyOn({ object: crypto, method: 'randomUUID' })
    .calledWith([])
    .returns('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  // Every quest resolves to the repo-root branch by default — the shape every quest built via
  // QuestStub (no worktreePath) is meant to take — so the worktree gate is transparent to every
  // test that isn't specifically about it. A test that wants a different resolution overrides
  // via setupWorktreeMissing/setupWorktreeDrifted below, addressed by that quest's own id, which
  // wins over this `[]` catch-all on specificity.
  cwdResolveMock
    .calledWith([])
    .resolves(
      QuestCwdResolutionStub({ kind: 'repo-root', cwd: RepoRootCwdStub({ value: '/test/repo/root' }) }),
    );

  const realWorktreeRestore = requireActual<{
    worktreeResumeRestoreBroker: typeof worktreeResumeRestoreBroker;
  }>({ module: '../../../brokers/worktree/resume-restore/worktree-resume-restore-broker' });
  worktreeRestoreMock
    .calledWith([])
    .implement(realWorktreeRestore.worktreeResumeRestoreBroker as never);

  const stageOrphanResetChain = ({ guildId, quest }: { guildId: GuildId; quest: Quest }): void => {
    const questPath = FilePathStub({
      value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
    });
    const questFilePath = FilePathStub({ value: `${questPath}/quest.json` });

    findQuestPathMock.calledWith([{ questId: quest.id }]).resolves({ questPath, guildId });
    loadMock.calledWith([{ questFilePath }]).resolves(quest);
    persistMock.calledWith([{ questFilePath }]).resolves({ success: true as const });
  };

  return {
    setupGuildWithQuests: ({
      guildId,
      guildPath,
      quests,
    }: {
      guildId: GuildId;
      guildPath: GuildPath;
      quests: Quest[];
    }): void => {
      guildGetProxy.setupDirectGuild({ guild: GuildStub({ id: guildId, path: guildPath }) });
      questListProxy.setupDirectList({ guildId, quests });

      // questModifyBroker (orphan reset, or the missing-worktree block path's get+modify) reads
      // and writes through this same chain for every quest — staged unconditionally so either
      // path composes for real regardless of which quest a test targets.
      for (const quest of quests) {
        stageOrphanResetChain({ guildId, quest });
      }
    },

    setupWorktreeMissing: ({
      quest,
      worktreePath,
    }: {
      quest: Quest;
      worktreePath: AbsoluteFilePath;
    }): void => {
      cwdResolveMock
        .calledWith([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'missing-worktree', worktreePath }));
    },

    setupWorktreeDrifted: ({
      quest,
      worktreePath,
      branchName,
      currentBranchName,
    }: {
      quest: Quest;
      worktreePath: AbsoluteFilePath;
      branchName: QuestBranchName;
      currentBranchName: string;
    }): void => {
      cwdResolveMock
        .calledWith([{ questId: quest.id }])
        .resolves(
          QuestCwdResolutionStub({
            kind: 'worktree',
            cwd: RepoRootCwdStub({ value: worktreePath }),
          }),
        );
      worktreeRestoreProxy.setupDrifted({ currentBranchName });
      worktreeRestoreProxy.setupCheckoutSucceeds({ branchName });
    },

    setupGuildWithExistingProcess: ({
      guildId,
      guildPath,
      quests,
      existingProcessQuestId,
    }: {
      guildId: GuildId;
      guildPath: GuildPath;
      quests: Quest[];
      existingProcessQuestId: QuestId;
    }): void => {
      guildGetProxy.setupDirectGuild({ guild: GuildStub({ id: guildId, path: guildPath }) });
      questListProxy.setupDirectList({ guildId, quests });

      // Pre-register a process for the specified quest
      orchestrationProcessesState.register({
        orchestrationProcess: {
          processId: 'proc-existing-process' as never,
          questId: existingProcessQuestId,
          kill: jest.fn(),
        },
      });
    },

    setupGuildDirectoryReadFailure: ({ error }: { error: Error }): void => {
      // questListBroker fails before RecoverGuildLayerResponder ever calls guildGetBroker, so
      // there is nothing for guildGetProxy to answer here.
      questListProxy.setupDirectListFailure({ error });
    },

    getRegisteredProcessIds: (): readonly ProcessId[] => orchestrationProcessesState.getAll(),

    // Read the `contents` argument straight off every questPersistBroker call this test made —
    // persistMock's real body never runs, so nothing ever reaches an underlying fs adapter now.
    getAllPersistedContents: (): readonly unknown[] =>
      persistMock.callsMatching([]).map((call) => {
        const [params] = call as [Parameters<typeof questPersistBroker>[0]];
        return params.contents;
      }),

    // The git argv actually spawned during a worktree restore — empty when no quest triggered
    // one. Asserting the complete array proves both the checkout's exact branchName AND that
    // nothing resembling stash/reset/force ever ran.
    getRestoreSpawnedArgs: (): readonly unknown[] => worktreeRestoreProxy.getSpawnedArgsList(),

    // The exact {worktreePath, branchName} this responder passed to worktreeResumeRestoreBroker.
    getWorktreeRestoreCalls: (): readonly unknown[] =>
      worktreeRestoreMock.callsMatching([]).map((call) => {
        const [params] = call as [{ worktreePath: AbsoluteFilePath; branchName: QuestBranchName }];
        return params;
      }),
  };
};
