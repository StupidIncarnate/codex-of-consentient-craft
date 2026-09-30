import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { Session } from '@dungeonmaster/shared/contracts';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestFindBySessionResponder } from './quest-find-by-session-responder';

type QuestId = ReturnType<typeof QuestIdStub>;

export const QuestFindBySessionResponderProxy = (): {
  setupFound: (params: { sessionId: Session['id']; questId: QuestId }) => void;
  setupNotFound: (params: { sessionId: Session['id'] }) => void;
  setupError: (params: { sessionId: Session['id']; message: string }) => void;
  callResponder: typeof QuestFindBySessionResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupFound: ({ sessionId, questId }: { sessionId: Session['id']; questId: QuestId }): void => {
      orchestrator.findQuestBySessionIdReturns({ sessionId, questId });
    },
    setupNotFound: ({ sessionId }: { sessionId: Session['id'] }): void => {
      orchestrator.findQuestBySessionIdReturns({ sessionId, questId: null });
    },
    setupError: ({ sessionId, message }: { sessionId: Session['id']; message: string }): void => {
      orchestrator.findQuestBySessionIdThrows({ sessionId, error: new Error(message) });
    },
    callResponder: QuestFindBySessionResponder,
  };
};
