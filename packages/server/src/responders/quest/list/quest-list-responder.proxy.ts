import { orchestratorListQuestsWithSkipsAdapterProxy } from '../../../adapters/orchestrator/list-quests-with-skips/orchestrator-list-quests-with-skips-adapter.proxy';
import type { QuestListItemStub, SkippedQuestFileStub } from '@dungeonmaster/shared/contracts';
import { QuestListResponder } from './quest-list-responder';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type SkippedQuestFile = ReturnType<typeof SkippedQuestFileStub>;

export const QuestListResponderProxy = (): {
  setupListQuests: (params: { quests: QuestListItem[] }) => void;
  setupListQuestsWithSkips: (params: {
    quests: QuestListItem[];
    skipped: SkippedQuestFile[];
  }) => void;
  setupListQuestsError: (params: { message: string }) => void;
  callResponder: typeof QuestListResponder;
} => {
  const adapterProxy = orchestratorListQuestsWithSkipsAdapterProxy();

  return {
    setupListQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      adapterProxy.returns({ quests, skipped: [] });
    },
    setupListQuestsWithSkips: ({
      quests,
      skipped,
    }: {
      quests: QuestListItem[];
      skipped: SkippedQuestFile[];
    }): void => {
      adapterProxy.returns({ quests, skipped });
    },
    setupListQuestsError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestListResponder,
  };
};
