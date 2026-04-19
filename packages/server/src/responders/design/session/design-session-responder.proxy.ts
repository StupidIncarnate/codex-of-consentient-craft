import type { ProcessIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorStartDesignChatAdapterProxy } from '../../../adapters/orchestrator/start-design-chat/orchestrator-start-design-chat-adapter.proxy';
import { DesignSessionResponder } from './design-session-responder';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type Quest = ReturnType<typeof QuestStub>;

export const DesignSessionResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupDesignChat: (params: { chatProcessId: ProcessId }) => void;
  setupDesignChatError: (params: { error: Error }) => void;
  callResponder: typeof DesignSessionResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorStartDesignChatAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ result: { success: true, quest } as never });
    },
    setupDesignChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      adapterProxy.returns({ chatProcessId });
    },
    setupDesignChatError: ({ error }: { error: Error }): void => {
      adapterProxy.throws({ error });
    },
    callResponder: DesignSessionResponder,
  };
};
