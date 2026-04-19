import type { ProcessIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorStartQuestAdapterProxy } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.proxy';
import { QuestStartResponder } from './quest-start-responder';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type Quest = ReturnType<typeof QuestStub>;

export const QuestStartResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupStartQuest: (params: { processId: ProcessId }) => void;
  setupStartQuestError: (params: { message: string }) => void;
  callResponder: typeof QuestStartResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorStartQuestAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ result: { success: true, quest } as never });
    },
    setupStartQuest: ({ processId }: { processId: ProcessId }): void => {
      adapterProxy.returns({ processId });
    },
    setupStartQuestError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestStartResponder,
  };
};
