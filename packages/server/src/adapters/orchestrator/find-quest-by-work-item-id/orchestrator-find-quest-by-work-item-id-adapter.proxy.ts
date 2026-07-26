import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorFindQuestByWorkItemIdAdapterProxy = (): {
  returns: (params: { workItemId: QuestWorkItemId; questId: QuestId | null }) => void;
  throws: (params: { workItemId: QuestWorkItemId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.findQuestByWorkItemId });
  // server-init-responder.proxy.ts constructs this adapter only to satisfy
  // enforce-proxy-child-creation and never stages a call of its own — its other tests never
  // exercise the lookup at all. Keep the fallback so an unrelated workItemId still resolves to
  // null instead of throwing "nothing set up for this call".
  mock.calledWith([]).resolves(null);

  return {
    returns: ({
      workItemId,
      questId,
    }: {
      workItemId: QuestWorkItemId;
      questId: QuestId | null;
    }): void => {
      mock.calledWith([{ workItemId }]).resolves(questId);
    },
    throws: ({ workItemId, error }: { workItemId: QuestWorkItemId; error: Error }): void => {
      mock.calledWith([{ workItemId }]).rejects(error);
    },
  };
};
