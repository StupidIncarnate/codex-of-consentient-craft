import { orchestratorPauseQuestAdapterProxy } from '../../../adapters/orchestrator/pause-quest/orchestrator-pause-quest-adapter.proxy';
import { QuestPauseResponder } from './quest-pause-responder';

export const QuestPauseResponderProxy = (): {
  setupPauseQuest: (params: { paused: boolean }) => void;
  setupPauseQuestError: (params: { message: string }) => void;
  callResponder: typeof QuestPauseResponder;
} => {
  const adapterProxy = orchestratorPauseQuestAdapterProxy();

  return {
    setupPauseQuest: ({ paused }: { paused: boolean }): void => {
      adapterProxy.returns({ paused });
    },
    setupPauseQuestError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestPauseResponder,
  };
};
