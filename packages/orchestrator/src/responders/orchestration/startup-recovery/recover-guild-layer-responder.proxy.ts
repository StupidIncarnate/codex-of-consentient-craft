/**
 * PURPOSE: Proxy for RecoverGuildLayerResponder that mocks filesystem, state, and orchestration dependencies
 *
 * USAGE:
 * const proxy = RecoverGuildLayerResponderProxy();
 * proxy.setupGuildWithQuests({guildId, guildPath, quests});
 * await RecoverGuildLayerResponder({guildItem});
 */

import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { randomUUID } from '#gateway/node/crypto';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { RepoRootCwdStub } from '@dungeonmaster/shared/contracts/repo-root-cwd/repo-root-cwd.stub';
import type { AbsoluteFilePath, GuildPath, ProcessId, QuestBranchName, Guild } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { questBlockOnFailureBrokerProxy } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker.proxy';
import { questCwdResolveBroker } from '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questListBrokerProxy } from '../../../brokers/quest/list/quest-list-broker.proxy';
import { questLoadBroker } from '../../../brokers/quest/load/quest-load-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { questOrchestrationLoopBrokerProxy } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy';
import { questPersistBroker } from '../../../brokers/quest/persist/quest-persist-broker';
import { worktreeResumeRestoreBroker } from '../../../brokers/worktree/resume-restore/worktree-resume-restore-broker';
import { worktreeEnsureQuestBranchBrokerProxy } from '../../../brokers/worktree/ensure-quest-branch/worktree-ensure-quest-branch-broker.proxy';
import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { QuestResumeTriggerStub } from '../../../contracts/quest-resume-trigger/quest-resume-trigger.stub';
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
// for a missing-worktree quest) composes the SAME chain for real — its own proxy is switched to
// passthrough below so it keeps running for real instead of resolving the stub default.
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
    guildId: Guild['id'];
    guildPath: GuildPath;
    quests: Quest[];
  }) => void;
  setupGuildWithExistingProcess: (params: {
    guildId: Guild['id'];
    guildPath: GuildPath;
    quests: Quest[];
    existingProcessQuestId: Quest['id'];
  }) => void;
  setupGuildDirectoryReadFailure: (params: { error: Error }) => void;
  setupWorktreeMissing: (params: { quest: Quest; worktreePath: AbsoluteFilePath }) => void;
  setupWorktreeDrifted: (params: {
    quest: Quest;
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    currentBranchName: string;
  }) => void;
  // Same drift setup as setupWorktreeDrifted, but the checkout itself fails — proves the sweep
  // logs under this trigger's own prefix and carries on instead of abandoning the guild.
  setupWorktreeRestoreFails: (params: {
    quest: Quest;
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    currentBranchName: string;
    output: string;
  }) => void;
  getRegisteredProcessIds: () => readonly ProcessId[];
  getAllPersistedContents: () => readonly unknown[];
  getRestoreSpawnedArgs: () => readonly unknown[];
  getWorktreeRestoreCalls: () => readonly unknown[];
  // Only the startup-recovery trigger's own restore warnings, in write order.
  getRestoreStderrWrites: () => readonly unknown[];
} => {
  stderrProxy();
  const guildGetProxy = guildGetBrokerProxy();
  const questListProxy = questListBrokerProxy();
  // questModifyBroker itself still runs for real below (only its findQuestPath/load/persist
  // dependencies are bypassed directly).
  const modifyProxy = questModifyBrokerProxy();
  const loopProxy = questOrchestrationLoopBrokerProxy();
  orchestrationEventsStateProxy();
  const stateProxy = orchestrationProcessesStateProxy();
  stateProxy.setupEmpty();
  const ensureQuestBranchProxy = worktreeEnsureQuestBranchBrokerProxy();
  // Switched to passthrough so the missing-worktree block path still runs questBlockOnFailureBroker's
  // real body (composing the questFindQuestPathBroker/questLoadBroker/questPersistBroker chain
  // mocked above) instead of resolving the proxy's stub default.
  const blockOnFailureProxy = questBlockOnFailureBrokerProxy();
  blockOnFailureProxy.setupPassthrough();
  // Registered for enforce-proxy-child-creation only: questCwdResolveBroker is module-mocked
  // above (per-questId addressing, see the comment on that registerModuleMock call), so this
  // child's own internal fs/broker mocks are never exercised.
  questCwdResolveBrokerProxy();

  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const loadMock = registerMock({ fn: questLoadBroker });
  const persistMock = registerMock({ fn: questPersistBroker });
  // The block path's real body re-reads the quest through questGetBroker, which answers each staged
  // quest by running its real lookup over the find/load mocks above.
  const getMock = registerMock({ fn: questGetBroker });
  const realGetMod = requireActual<{ questGetBroker: typeof questGetBroker }>({
    module: '../../../brokers/quest/get/quest-get-broker',
  });
  const cwdResolveMock = registerMock({ fn: questCwdResolveBroker });
  const worktreeRestoreMock = registerMock({ fn: worktreeResumeRestoreBroker });

  registerMock({ fn: randomUUID }).calledWith([]).returns('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  const realWorktreeRestore = requireActual<{
    worktreeResumeRestoreBroker: typeof worktreeResumeRestoreBroker;
  }>({ module: '../../../brokers/worktree/resume-restore/worktree-resume-restore-broker' });
  // Every quest resolves to the repo-root branch by default — the shape every quest built via
  // QuestStub (no worktreePath) is meant to take — so the worktree gate is transparent to every
  // test that isn't specifically about it. A test that wants a different resolution overrides
  // via setupWorktreeMissing/setupWorktreeDrifted below with a live one-shot at the same address,
  // which wins over this sticky default whichever was staged first.
  const stageRepoRoot = ({ quest }: { quest: Quest }): void => {
    cwdResolveMock.calledWith([{ questId: quest.id }]).resolves(
      QuestCwdResolutionStub({
        kind: 'repo-root',
        cwd: RepoRootCwdStub({ value: '/test/repo/root' }),
      }),
    );
  };

  const stageOrphanResetChain = ({ guildId, quest }: { guildId: Guild['id']; quest: Quest }): void => {
    const questPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`;
    const questFilePath = `${questPath}/quest.json`;

    findQuestPathMock.calledWith([{ questId: quest.id }]).resolves({ questPath, guildId });
    loadMock.calledWith([{ questFilePath }]).resolves(quest);
    persistMock.calledWith([{ questFilePath }]).resolves({ success: true as const });
    stageRepoRoot({ quest });
    getMock
      .calledWith([{ input: { questId: quest.id } }])
      .implement(realGetMod.questGetBroker as never);
  };

  return {
    setupGuildWithQuests: ({
      guildId,
      guildPath,
      quests,
    }: {
      guildId: Guild['id'];
      guildPath: GuildPath;
      quests: Quest[];
    }): void => {
      guildGetProxy.setupDirectGuild({ guild: GuildStub({ id: guildId, path: guildPath }) });
      questListProxy.setupDirectList({ guildId, quests });
      // The loop resolves its slot count from the guild path it is launched with; an unstaged
      // config address is no longer swallowed into the default.
      loopProxy.setupConfigResolves({ filePath: guildPath });

      // questModifyBroker (orphan reset, or the missing-worktree block path's get+modify) reads
      // and writes through this same chain for every quest — staged unconditionally so either
      // path composes for real regardless of which quest a test targets.
      modifyProxy.setupRealBroker();
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
        .onceFor([{ questId: quest.id }])
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
      cwdResolveMock.onceFor([{ questId: quest.id }]).resolves(
        QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: RepoRootCwdStub({ value: worktreePath }),
        }),
      );
      worktreeRestoreMock
        .calledWith([{ worktreePath, branchName }])
        .implement(realWorktreeRestore.worktreeResumeRestoreBroker as never);
      ensureQuestBranchProxy.setupDrifted({ currentBranchName });
      ensureQuestBranchProxy.setupCheckoutSucceeds({ branchName });
    },

    setupWorktreeRestoreFails: ({
      quest,
      worktreePath,
      branchName,
      currentBranchName,
      output,
    }: {
      quest: Quest;
      worktreePath: AbsoluteFilePath;
      branchName: QuestBranchName;
      currentBranchName: string;
      output: string;
    }): void => {
      cwdResolveMock.onceFor([{ questId: quest.id }]).resolves(
        QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: RepoRootCwdStub({ value: worktreePath }),
        }),
      );
      worktreeRestoreMock
        .calledWith([{ worktreePath, branchName }])
        .implement(realWorktreeRestore.worktreeResumeRestoreBroker as never);
      ensureQuestBranchProxy.setupDrifted({ currentBranchName });
      ensureQuestBranchProxy.setupCheckoutFails({ branchName, output });
    },

    setupGuildWithExistingProcess: ({
      guildId,
      guildPath,
      quests,
      existingProcessQuestId,
    }: {
      guildId: Guild['id'];
      guildPath: GuildPath;
      quests: Quest[];
      existingProcessQuestId: Quest['id'];
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
    getRestoreSpawnedArgs: (): readonly unknown[] => ensureQuestBranchProxy.getSpawnedArgsList(),

    // The exact {worktreePath, branchName} the shared restore step was handed for this sweep.
    getWorktreeRestoreCalls: (): readonly unknown[] =>
      worktreeRestoreMock.callsMatching([]).map((call) => {
        const [params] = call as [{ worktreePath: AbsoluteFilePath; branchName: QuestBranchName }];
        return params;
      }),

    getRestoreStderrWrites: (): readonly unknown[] =>
      ensureQuestBranchProxy.getStderrWrites({
        trigger: QuestResumeTriggerStub({ value: 'recover-guild-layer-responder' }),
      }),
  };
};
