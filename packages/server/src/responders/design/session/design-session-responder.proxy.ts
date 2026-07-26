import type { ProcessIdStub, QuestId, QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorStartDesignChatAdapterProxy } from '../../../adapters/orchestrator/start-design-chat/orchestrator-start-design-chat-adapter.proxy';
import { DesignSessionResponder } from './design-session-responder';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type Quest = ReturnType<typeof QuestStub>;

export const DesignSessionResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupDesignChat: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupDesignChatError: (params: { questId: QuestId; error: Error }) => void;
  callResponder: typeof DesignSessionResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorStartDesignChatAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ questId: quest.id, result: { success: true, quest } as never });
    },
    setupDesignChat: ({
      questId,
      chatProcessId,
    }: {
      questId: QuestId;
      chatProcessId: ProcessId;
    }): void => {
      adapterProxy.returns({ questId, chatProcessId });
    },
    setupDesignChatError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      adapterProxy.throws({ questId, error });
    },
    callResponder: DesignSessionResponder,
  };
};
