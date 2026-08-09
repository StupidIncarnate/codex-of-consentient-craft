import { RepoRootCwdStub } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePathStub,
  GuildListItem,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
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

export const scanOnceLayerBrokerProxy = (): {
  setupGuildsAndQuests: (params: {
    guildItems: readonly GuildListItem[];
    questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
  }) => void;
  setupNoGuilds: () => void;
  setupModifyForQuest: (params: { quest: Quest }) => void;
  setupSelfHeal: (params: { staleQuest: Quest; refreshedQuest: Quest }) => void;
  setupWorktreeMissing: (params: { quest: Quest; worktreePath: AbsoluteFilePath }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => Quest;
  getBlockCalls: () => readonly unknown[];
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
    getAllPersistedContents: advanceProxy.getAllPersistedContents,
    getLastPersistedQuest: advanceProxy.getLastPersistedQuest,
    // Lets a test prove that an escalated (budget-exhausted) orphan blocked the quest AND that
    // the scan stopped there instead of advancing the ledger and dispatching.
    getBlockCalls: recoverProxy.getBlockCalls,
  };
};
