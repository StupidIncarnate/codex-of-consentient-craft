import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { QuestIdStub, SessionId } from '@dungeonmaster/shared/contracts';
import { QuestFindBySessionResponder } from './quest-find-by-session-responder';

type QuestId = ReturnType<typeof QuestIdStub>;

export const QuestFindBySessionResponderProxy = (): {
  setupFound: (params: { sessionId: SessionId; questId: QuestId }) => void;
  setupNotFound: (params: { sessionId: SessionId }) => void;
  setupError: (params: { sessionId: SessionId; message: string }) => void;
  callResponder: typeof QuestFindBySessionResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupFound: ({ sessionId, questId }: { sessionId: SessionId; questId: QuestId }): void => {
      orchestrator.findQuestBySessionIdReturns({ sessionId, questId });
    },
    setupNotFound: ({ sessionId }: { sessionId: SessionId }): void => {
      orchestrator.findQuestBySessionIdReturns({ sessionId, questId: null });
    },
    setupError: ({ sessionId, message }: { sessionId: SessionId; message: string }): void => {
      orchestrator.findQuestBySessionIdThrows({ sessionId, error: new Error(message) });
    },
    callResponder: QuestFindBySessionResponder,
  };
};
