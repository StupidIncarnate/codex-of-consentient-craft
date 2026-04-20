import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorResumeQuestAdapterProxy } from '../../../adapters/orchestrator/resume-quest/orchestrator-resume-quest-adapter.proxy';
import { QuestResumeResponder } from './quest-resume-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestResumeResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupResumeQuest: (params: { resumed: boolean; restoredStatus: QuestStatus }) => void;
  setupResumeQuestError: (params: { message: string }) => void;
  callResponder: typeof QuestResumeResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorResumeQuestAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ result: { success: true, quest } as never });
    },
    setupResumeQuest: ({
      resumed,
      restoredStatus,
    }: {
      resumed: boolean;
      restoredStatus: QuestStatus;
    }): void => {
      adapterProxy.returns({ resumed, restoredStatus });
    },
    setupResumeQuestError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestResumeResponder,
  };
};
