import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestMergeResponder } from './quest-merge-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestMergeResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupQuestNotFound: (params: { questId: Quest['id'] }) => void;
  setupMergeQuest: (params: { questId: Quest['id']; merging: boolean }) => void;
  setupMergeQuestError: (params: { questId: Quest['id']; message: string }) => void;
  getMergeQuestCalls: () => readonly unknown[];
  callResponder: typeof QuestMergeResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      orchestrator.getQuestReturns({
        questId: quest.id,
        result: GetQuestResultStub({ success: true, quest }),
      });
    },
    // The real questGetBroker failure shape, traced through QuestNotFoundError — same scenario
    // StartOrchestratorProxy's own getQuestNotFound composes for every other caller.
    setupQuestNotFound: ({ questId }: { questId: Quest['id'] }): void => {
      orchestrator.getQuestNotFound({ questId });
    },
    setupMergeQuest: ({ questId, merging }: { questId: Quest['id']; merging: boolean }): void => {
      orchestrator.mergeQuestReturns({ questId, merging });
    },
    setupMergeQuestError: ({ questId, message }: { questId: Quest['id']; message: string }): void => {
      orchestrator.mergeQuestThrows({ questId, error: new Error(message) });
    },
    // Every call StartOrchestrator.mergeQuest received, so a rejected-status test can prove it
    // received NONE — not just that the responder's own return value looks right.
    getMergeQuestCalls: (): readonly unknown[] => orchestrator.mergeQuestGetCalls(),
    callResponder: QuestMergeResponder,
  };
};
