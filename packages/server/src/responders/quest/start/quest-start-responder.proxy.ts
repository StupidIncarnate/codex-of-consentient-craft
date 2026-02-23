import { orchestratorStartQuestAdapterProxy } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.proxy';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import { QuestStartResponder } from './quest-start-responder';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const QuestStartResponderProxy = (): {
  setupStartQuest: (params: { processId: ProcessId }) => void;
  setupStartQuestError: (params: { message: string }) => void;
  callResponder: typeof QuestStartResponder;
} => {
  const adapterProxy = orchestratorStartQuestAdapterProxy();

  return {
    setupStartQuest: ({ processId }: { processId: ProcessId }): void => {
      adapterProxy.returns({ processId });
    },
    setupStartQuestError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestStartResponder,
  };
};
