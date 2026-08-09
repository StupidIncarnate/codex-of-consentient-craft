import type { QuestId, QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorMergeQuestAdapterProxy } from '../../../adapters/orchestrator/merge-quest/orchestrator-merge-quest-adapter.proxy';
import { QuestMergeResponder } from './quest-merge-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestMergeResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupQuestNotFound: (params: { questId: QuestId }) => void;
  setupMergeQuest: (params: { questId: QuestId; merging: boolean }) => void;
  setupMergeQuestError: (params: { questId: QuestId; message: string }) => void;
  getMergeQuestCalls: () => readonly unknown[];
  callResponder: typeof QuestMergeResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const mergeProxy = orchestratorMergeQuestAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ questId: quest.id, result: { success: true, quest } as never });
    },
    setupQuestNotFound: ({ questId }: { questId: QuestId }): void => {
      questProxy.returns({ questId, result: { success: false, quest: undefined } as never });
    },
    setupMergeQuest: ({ questId, merging }: { questId: QuestId; merging: boolean }): void => {
      mergeProxy.returns({ questId, merging });
    },
    setupMergeQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      mergeProxy.throws({ questId, error: new Error(message) });
    },
    // Every call the adapter received, so a rejected-status test can prove it received NONE — not
    // just that the responder's own return value looks right.
    getMergeQuestCalls: (): readonly unknown[] => mergeProxy.getCalls(),
    callResponder: QuestMergeResponder,
  };
};
