import { orchestratorFindQuestBySessionIdAdapterProxy } from '../../../adapters/orchestrator/find-quest-by-session-id/orchestrator-find-quest-by-session-id-adapter.proxy';
import type { QuestIdStub, SessionId } from '@dungeonmaster/shared/contracts';
import { QuestFindBySessionResponder } from './quest-find-by-session-responder';

type QuestId = ReturnType<typeof QuestIdStub>;

export const QuestFindBySessionResponderProxy = (): {
  setupFound: (params: { sessionId: SessionId; questId: QuestId }) => void;
  setupNotFound: (params: { sessionId: SessionId }) => void;
  setupError: (params: { sessionId: SessionId; message: string }) => void;
  callResponder: typeof QuestFindBySessionResponder;
} => {
  const adapterProxy = orchestratorFindQuestBySessionIdAdapterProxy();

  return {
    setupFound: ({ sessionId, questId }: { sessionId: SessionId; questId: QuestId }): void => {
      adapterProxy.returns({ sessionId, questId });
    },
    setupNotFound: ({ sessionId }: { sessionId: SessionId }): void => {
      adapterProxy.returns({ sessionId, questId: null });
    },
    setupError: ({ sessionId, message }: { sessionId: SessionId; message: string }): void => {
      adapterProxy.throws({ sessionId, error: new Error(message) });
    },
    callResponder: QuestFindBySessionResponder,
  };
};
