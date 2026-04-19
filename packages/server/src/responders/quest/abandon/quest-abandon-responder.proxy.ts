import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorAbandonQuestAdapterProxy } from '../../../adapters/orchestrator/abandon-quest/orchestrator-abandon-quest-adapter.proxy';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { QuestAbandonResponder } from './quest-abandon-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestAbandonResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupAbandonQuest: (params: { abandoned: boolean }) => void;
  setupAbandonQuestError: (params: { message: string }) => void;
  callResponder: typeof QuestAbandonResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorAbandonQuestAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ result: { success: true, quest } as never });
    },
    setupAbandonQuest: ({ abandoned }: { abandoned: boolean }): void => {
      adapterProxy.returns({ abandoned });
    },
    setupAbandonQuestError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestAbandonResponder,
  };
};
