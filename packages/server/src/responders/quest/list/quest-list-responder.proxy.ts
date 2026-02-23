import { orchestratorListQuestsAdapterProxy } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import type { QuestListItemStub } from '@dungeonmaster/shared/contracts';
import { QuestListResponder } from './quest-list-responder';

type QuestListItem = ReturnType<typeof QuestListItemStub>;

export const QuestListResponderProxy = (): {
  setupListQuests: (params: { quests: QuestListItem[] }) => void;
  setupListQuestsError: (params: { message: string }) => void;
  callResponder: typeof QuestListResponder;
} => {
  const adapterProxy = orchestratorListQuestsAdapterProxy();

  return {
    setupListQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      adapterProxy.returns({ quests });
    },
    setupListQuestsError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestListResponder,
  };
};
