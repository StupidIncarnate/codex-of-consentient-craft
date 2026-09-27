import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
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
  const orchestrator = StartOrchestratorProxy();

  return {
    setupListQuests: ({ guildId, quests }: { guildId: GuildId; quests: QuestListItem[] }): void => {
      orchestrator.listQuestsWithSkipsReturns({ guildId, quests, skipped: [] });
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
      orchestrator.listQuestsWithSkipsReturns({ guildId, quests, skipped });
    },
    setupListQuestsError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      orchestrator.listQuestsWithSkipsThrows({ guildId, error: new Error(message) });
    },
    callResponder: QuestListResponder,
  };
};
