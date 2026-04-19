import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorPauseQuestAdapterProxy } from '../../../adapters/orchestrator/pause-quest/orchestrator-pause-quest-adapter.proxy';
import { QuestPauseResponder } from './quest-pause-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestPauseResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupPauseQuest: (params: { paused: boolean }) => void;
  setupPauseQuestError: (params: { message: string }) => void;
  callResponder: typeof QuestPauseResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const adapterProxy = orchestratorPauseQuestAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ result: { success: true, quest } as never });
    },
    setupPauseQuest: ({ paused }: { paused: boolean }): void => {
      adapterProxy.returns({ paused });
    },
    setupPauseQuestError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestPauseResponder,
  };
};
