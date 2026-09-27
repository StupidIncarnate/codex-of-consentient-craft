import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { QuestId, QuestStub } from '@dungeonmaster/shared/contracts';
import { QuestGetResponder } from './quest-get-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestGetResponderProxy = (): {
  setupGetQuest: (params: { quest: Quest }) => { expectedData: { success: true; quest: Quest } };
  setupGetQuestError: (params: { questId: QuestId; message: string }) => void;
  setupGetQuestFailure: (params: { questId: QuestId; error: string }) => void;
  callResponder: typeof QuestGetResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupGetQuest: ({
      quest,
    }: {
      quest: Quest;
    }): { expectedData: { success: true; quest: Quest } } => {
      const result = { success: true as const, quest };
      orchestrator.getQuestReturns({ questId: quest.id, result: result as never });
      return { expectedData: result };
    },
    setupGetQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      orchestrator.getQuestThrows({ questId, error: new Error(message) });
    },
    // questGetBroker catches its own failures and RETURNS `{ success: false, error }` rather than
    // throwing, so this — not `setupGetQuestError` — is the shape a missing or unparseable quest
    // actually produces.
    setupGetQuestFailure: ({ questId, error }: { questId: QuestId; error: string }): void => {
      orchestrator.getQuestReturns({ questId, result: { success: false, error } as never });
    },
    callResponder: QuestGetResponder,
  };
};
