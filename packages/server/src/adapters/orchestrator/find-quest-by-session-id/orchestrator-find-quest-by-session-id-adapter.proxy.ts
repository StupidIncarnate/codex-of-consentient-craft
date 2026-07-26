import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId, SessionId } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorFindQuestBySessionIdAdapterProxy = (): {
  returns: (params: { sessionId: SessionId; questId: QuestId | null }) => void;
  throws: (params: { sessionId: SessionId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.findQuestBySessionId });

  return {
    returns: ({ sessionId, questId }: { sessionId: SessionId; questId: QuestId | null }): void => {
      mock.calledWith([{ sessionId }]).resolves(questId);
    },
    throws: ({ sessionId, error }: { sessionId: SessionId; error: Error }): void => {
      mock.calledWith([{ sessionId }]).rejects(error);
    },
  };
};
