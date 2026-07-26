import { orchestratorListQuestsWithSkipsAdapterProxy } from '../../../adapters/orchestrator/list-quests-with-skips/orchestrator-list-quests-with-skips-adapter.proxy';
import type {
  GuildId,
  QuestListItemStub,
  SkippedQuestFileStub,
} from '@dungeonmaster/shared/contracts';
import { QuestListResponder } from './quest-list-responder';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type SkippedQuestFile = ReturnType<typeof SkippedQuestFileStub>;

export const QuestListResponderProxy = (): {
  setupListQuests: (params: { guildId: GuildId; quests: QuestListItem[] }) => void;
  setupListQuestsWithSkips: (params: {
    guildId: GuildId;
    quests: QuestListItem[];
    skipped: SkippedQuestFile[];
  }) => void;
  setupListQuestsError: (params: { guildId: GuildId; message: string }) => void;
  callResponder: typeof QuestListResponder;
} => {
  const adapterProxy = orchestratorListQuestsWithSkipsAdapterProxy();

  return {
    setupListQuests: ({ guildId, quests }: { guildId: GuildId; quests: QuestListItem[] }): void => {
      adapterProxy.returns({ guildId, quests, skipped: [] });
    },
    setupListQuestsWithSkips: ({
      guildId,
      quests,
      skipped,
    }: {
      guildId: GuildId;
      quests: QuestListItem[];
      skipped: SkippedQuestFile[];
    }): void => {
      adapterProxy.returns({ guildId, quests, skipped });
    },
    setupListQuestsError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      adapterProxy.throws({ guildId, error: new Error(message) });
    },
    callResponder: QuestListResponder,
  };
};
