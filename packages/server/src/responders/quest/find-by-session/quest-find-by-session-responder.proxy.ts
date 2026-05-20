import { orchestratorFindQuestBySessionIdAdapterProxy } from '../../../adapters/orchestrator/find-quest-by-session-id/orchestrator-find-quest-by-session-id-adapter.proxy';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts';
import { QuestFindBySessionResponder } from './quest-find-by-session-responder';

type QuestId = ReturnType<typeof QuestIdStub>;

export const QuestFindBySessionResponderProxy = (): {
  setupFound: (params: { questId: QuestId }) => void;
  setupNotFound: () => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof QuestFindBySessionResponder;
} => {
  const adapterProxy = orchestratorFindQuestBySessionIdAdapterProxy();

  return {
    setupFound: ({ questId }: { questId: QuestId }): void => {
      adapterProxy.returns({ questId });
    },
    setupNotFound: (): void => {
      adapterProxy.returns({ questId: null });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestFindBySessionResponder,
  };
};
