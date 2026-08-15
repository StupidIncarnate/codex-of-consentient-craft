import { RepoRootCwdStub } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePathStub,
  GuildListItem,
  QuestBranchName,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { worktreeEnsureQuestBranchBrokerProxy } from '../../worktree/ensure-quest-branch/worktree-ensure-quest-branch-broker.proxy';
import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { QuestResumeTriggerStub } from '../../../contracts/quest-resume-trigger/quest-resume-trigger.stub';
import { questActiveQuestsBrokerProxy } from '../active-quests/quest-active-quests-broker.proxy';
import { questAdvanceBrokerProxy } from '../advance/quest-advance-broker.proxy';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { blockOnMissingWorktreeLayerBrokerProxy } from './block-on-missing-worktree-layer-broker.proxy';
import { computeNextStepFromQuestLayerBrokerProxy } from './compute-next-step-from-quest-layer-broker.proxy';
import { questHasIncompleteWorkLayerBrokerProxy } from './quest-has-incomplete-work-layer-broker.proxy';
import { recoverOrphanedWorkItemsLayerBrokerProxy } from './recover-orphaned-work-items-layer-broker.proxy';

// questCwdResolveBroker has its own dedicated fs-backed test suite
// (quest-cwd-resolve-broker.test.ts). Re-deriving realistic fs state for it here — on top of the
// fs state get/advance/modify already stage for the SAME default guildId+folder every QuestStub
// shares — collides real reads across quests the moment a scan-once test seeds more than one
// (two quests, same default folder, feed the same mocked file address). Addressing this mock by
// questId sidesteps that entirely: each quest gets its own independent resolution regardless of
// how many share a folder.
registerModuleMock({ module: '../cwd-resolve/quest-cwd-resolve-broker' });

type Quest = ReturnType<typeof QuestStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;
type RepoRootCwd = ReturnType<typeof RepoRootCwdStub>;

export const scanOnceLayerBrokerProxy = (): {
  setupGuildsAndQuests: (params: {
    guildItems: readonly GuildListItem[];
    questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
  }) => void;
  setupNoGuilds: () => void;
  setupModifyForQuest: (params: { quest: Quest }) => void;
  setupSelfHeal: (params: { staleQuest: Quest; refreshedQuest: Quest }) => void;
  // Pins the id questAdvanceBroker mints its work item with, so a self-heal test can assert the
  // item the ledger really gained IS the one the refreshed read hands back as the step — rather
  // than only that both happen to be riftcarver-shaped.
  setupAdvanceUuids: ReturnType<typeof questAdvanceBrokerProxy>['setupUuids'];
  setupWorktreeMissing: (params: { quest: Quest; worktreePath: AbsoluteFilePath }) => void;
  // The POSITIVE counterpart to setupWorktreeMissing above: overrides the sticky repo-root
  // default (registered by setupGuildsAndQuests for every quest) with a `kind: 'worktree'`
  // resolution for exactly this one quest's `questCwdResolveBroker` call, so a test can prove
  // the scan proceeds past the missing-worktree guard for a REAL worktree resolution — not just
  // for the repo-root fallback every other test already exercises.
  setupQuestWorktree: (params: { quest: Quest; worktreeCwd: RepoRootCwd }) => void;
  // Same `kind: 'worktree'` override as setupQuestWorktree, plus the git spawns underneath the
  // real worktreeResumeRestoreBroker body: a rev-parse reporting `currentBranchName`, then a
  // checkout onto the quest branch. Lets a test drive the DRIFTED half of the discrimination.
  setupQuestWorktreeDrifted: (params: {
    quest: Quest;
    worktreeCwd: RepoRootCwd;
    branchName: QuestBranchName;
    currentBranchName: string;
  }) => void;
  // The drift-free half: rev-parse already reports the quest branch, so the real broker returns
  // before spawning any checkout at all.
  setupQuestWorktreeOnBranch: (params: {
    quest: Quest;
    worktreeCwd: RepoRootCwd;
    branchName: QuestBranchName;
  }) => void;
  // Drifted, but the checkout itself fails — the branch stays wrong and the shared restore logs
  // its trigger-prefixed warning instead of halting the scan.
  setupQuestWorktreeRestoreFails: (params: {
    quest: Quest;
    worktreeCwd: RepoRootCwd;
    branchName: QuestBranchName;
    currentBranchName: string;
    output: string;
  }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => Quest;
  getBlockCalls: () => readonly unknown[];
  // The git argv actually spawned during this scan — empty when the scan never touched git.
  // Asserting the complete array proves both the checkout's exact branchName AND that nothing
  // resembling stash/reset/force ever ran.
  getRestoreSpawnedArgs: () => readonly unknown[];
  // Only the dispatcher trigger's own restore warnings, in write order — the shared stderr spy
  // carries every proxy's lines, so it is filtered down to this trigger's prefix.
  getRestoreStderrWrites: () => readonly unknown[];
} => {
  const activeQuestsProxy = questActiveQuestsBrokerProxy();
  computeNextStepFromQuestLayerBrokerProxy();
  questHasIncompleteWorkLayerBrokerProxy();
  const recoverProxy = recoverOrphanedWorkItemsLayerBrokerProxy();
  const advanceProxy = questAdvanceBrokerProxy();
  const getProxy = questGetBrokerProxy();
  // Registered for enforce-proxy-child-creation only: questCwdResolveBroker is module-mocked
  // below (per-questId addressing, see the comment on that registerModuleMock call), and
  // recoverProxy already registers questBlockOnFailureBrokerProxy, which is what
  // blockOnMissingWorktreeLayerBroker calls under the hood.
  questCwdResolveBrokerProxy();
  blockOnMissingWorktreeLayerBrokerProxy();
  // Stages the git spawns beneath the real shared restore step so a scan that reaches it runs for
  // real all the way down to `child_process.spawn`, instead of being told the answer by a stub.
  const ensureQuestBranchProxy = worktreeEnsureQuestBranchBrokerProxy();
  const dispatchScanTrigger = QuestResumeTriggerStub({ value: 'dispatch-scan' });
  const cwdResolveMock = registerMock({ fn: questCwdResolveBroker });
  const defaultRepoRoot = RepoRootCwdStub({ value: '/test/repo/root' });

  return {
    // Every quest handed to the scan resolves to the repo-root branch by default — the shape
    // every quest built via QuestStub (no worktreePath) is meant to take — so the missing-
    // worktree gate is transparent to every test that isn't specifically about it. A test that
    // wants the OTHER branch overrides via setupWorktreeMissing below, which wins for exactly
    // one call (a live one-shot outranks this sticky default), addressed by that quest's own id.
    setupGuildsAndQuests: (params: {
      guildItems: readonly GuildListItem[];
      questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
    }): void => {
      activeQuestsProxy.setupGuildsAndQuests(params);
      for (const { quests } of params.questsByGuildId) {
        for (const quest of quests) {
          cwdResolveMock
            .calledWith([{ questId: quest.id }])
            .resolves(QuestCwdResolutionStub({ kind: 'repo-root', cwd: defaultRepoRoot }));
        }
      }
    },
    setupNoGuilds: activeQuestsProxy.setupNoGuilds,
    setupModifyForQuest: recoverProxy.setupModifyForQuest,
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
    setupQuestWorktree: ({
      quest,
      worktreeCwd,
    }: {
      quest: Quest;
      worktreeCwd: RepoRootCwd;
    }): void => {
      cwdResolveMock
        .onceFor([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'worktree', cwd: worktreeCwd }));
    },
    setupQuestWorktreeDrifted: ({
      quest,
      worktreeCwd,
      branchName,
      currentBranchName,
    }: {
      quest: Quest;
      worktreeCwd: RepoRootCwd;
      branchName: QuestBranchName;
      currentBranchName: string;
    }): void => {
      cwdResolveMock
        .onceFor([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'worktree', cwd: worktreeCwd }));
      ensureQuestBranchProxy.setupDrifted({ currentBranchName });
      ensureQuestBranchProxy.setupCheckoutSucceeds({ branchName });
    },
    setupQuestWorktreeOnBranch: ({
      quest,
      worktreeCwd,
      branchName,
    }: {
      quest: Quest;
      worktreeCwd: RepoRootCwd;
      branchName: QuestBranchName;
    }): void => {
      cwdResolveMock
        .onceFor([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'worktree', cwd: worktreeCwd }));
      ensureQuestBranchProxy.setupOnBranch({ branchName });
    },
    setupQuestWorktreeRestoreFails: ({
      quest,
      worktreeCwd,
      branchName,
      currentBranchName,
      output,
    }: {
      quest: Quest;
      worktreeCwd: RepoRootCwd;
      branchName: QuestBranchName;
      currentBranchName: string;
      output: string;
    }): void => {
      cwdResolveMock
        .onceFor([{ questId: quest.id }])
        .resolves(QuestCwdResolutionStub({ kind: 'worktree', cwd: worktreeCwd }));
      ensureQuestBranchProxy.setupDrifted({ currentBranchName });
      ensureQuestBranchProxy.setupCheckoutFails({ branchName, output });
    },
    // Advance self-heal path: questAdvanceBroker runs a real read-modify-write against the stale
    // quest (find → load → persist), then scan re-reads the quest fresh (find → load) — queue one
    // chain per step, in call order.
    setupSelfHeal: ({
      staleQuest,
      refreshedQuest,
    }: {
      staleQuest: Quest;
      refreshedQuest: Quest;
    }): void => {
      advanceProxy.setupQuestFound({ quest: staleQuest });
      getProxy.setupQuestFound({ quest: refreshedQuest });
    },
    setupAdvanceUuids: advanceProxy.setupUuids,
    getAllPersistedContents: advanceProxy.getAllPersistedContents,
    getLastPersistedQuest: advanceProxy.getLastPersistedQuest,
    // Lets a test prove that an escalated (budget-exhausted) orphan blocked the quest AND that
    // the scan stopped there instead of advancing the ledger and dispatching.
    getBlockCalls: recoverProxy.getBlockCalls,
    getRestoreSpawnedArgs: ensureQuestBranchProxy.getSpawnedArgsList,
    getRestoreStderrWrites: (): readonly unknown[] =>
      ensureQuestBranchProxy.getStderrWrites({ trigger: dispatchScanTrigger }),
  };
};
