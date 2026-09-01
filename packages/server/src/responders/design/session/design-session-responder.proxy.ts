import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProcessIdStub, QuestId, QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorStartDesignChatAdapterProxy } from '../../../adapters/orchestrator/start-design-chat/orchestrator-start-design-chat-adapter.proxy';
import { pastedImagePersistBrokerProxy } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker.proxy';
import { DesignSessionResponder } from './design-session-responder';

type ProcessId = ReturnType<typeof ProcessIdStub>;
type Quest = ReturnType<typeof QuestStub>;

export const DesignSessionResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupDesignChat: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupDesignChatError: (params: { questId: QuestId; error: Error }) => void;
  setupImagePersistHome: (params: { homePath: string }) => void;
  stagePersistedImageIds: (params: { ids: readonly string[] }) => void;
  persistedImageWriteCallCount: () => unknown;
  getStartDesignChatCalls: () => readonly unknown[];
  callResponder: typeof DesignSessionResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorStartDesignChatAdapterProxy();
  const imagePersistProxy = pastedImagePersistBrokerProxy();

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
    setupImagePersistHome: ({ homePath }: { homePath: string }): void => {
      imagePersistProxy.setupHome({ homePath });
    },
    stagePersistedImageIds: ({ ids }: { ids: readonly string[] }): void => {
      imagePersistProxy.stageImageIds({ ids });
    },
    persistedImageWriteCallCount: (): unknown => imagePersistProxy.writeCallCount(),
    // StartOrchestrator.startDesignChat is the SAME auto-mocked function reference
    // orchestratorStartDesignChatAdapterProxy() above registers dispatch on — reading its
    // .mock.calls here proves what the responder actually forwarded (call count AND args)
    // without adding call-arg introspection to the adapter proxy itself.
    getStartDesignChatCalls: (): readonly unknown[] => {
      const startDesignChatFn = StartOrchestrator.startDesignChat as jest.MockedFunction<
        typeof StartOrchestrator.startDesignChat
      >;
      return startDesignChatFn.mock.calls.map(([firstArg]) => firstArg);
    },
    callResponder: DesignSessionResponder,
  };
};
