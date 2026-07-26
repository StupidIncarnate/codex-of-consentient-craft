import type { QuestId, QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorPauseQuestAdapterProxy } from '../../../adapters/orchestrator/pause-quest/orchestrator-pause-quest-adapter.proxy';
import { QuestPauseResponder } from './quest-pause-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestPauseResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupPauseQuest: (params: { questId: QuestId; paused: boolean }) => void;
  setupPauseQuestError: (params: { questId: QuestId; message: string }) => void;
  callResponder: typeof QuestPauseResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorPauseQuestAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ questId: quest.id, result: { success: true, quest } as never });
    },
    setupPauseQuest: ({ questId, paused }: { questId: QuestId; paused: boolean }): void => {
      adapterProxy.returns({ questId, paused });
    },
    setupPauseQuestError: ({ questId, message }: { questId: QuestId; message: string }): void => {
      adapterProxy.throws({ questId, error: new Error(message) });
    },
    callResponder: QuestPauseResponder,
  };
};
