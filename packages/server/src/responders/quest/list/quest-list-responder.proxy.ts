import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { Guild } from '@dungeonmaster/shared/contracts';
import type { QuestListItemStub } from '@dungeonmaster/shared/contracts/quest-list-item/quest-list-item.stub';
import type { SkippedQuestFileStub } from '@dungeonmaster/shared/contracts/skipped-quest-file/skipped-quest-file.stub';
import { QuestListResponder } from './quest-list-responder';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type SkippedQuestFile = ReturnType<typeof SkippedQuestFileStub>;

export const QuestListResponderProxy = (): {
  setupListQuests: (params: { guildId: Guild['id']; quests: QuestListItem[] }) => void;
  setupListQuestsWithSkips: (params: {
    guildId: Guild['id'];
    quests: QuestListItem[];
    skipped: SkippedQuestFile[];
  }) => void;
  setupListQuestsError: (params: { guildId: Guild['id']; message: string }) => void;
  callResponder: typeof QuestListResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupListQuests: ({
      guildId,
      quests,
    }: {
      guildId: Guild['id'];
      quests: QuestListItem[];
    }): void => {
      orchestrator.listQuestsWithSkipsReturns({ guildId, quests, skipped: [] });
    },
    setupListQuestsWithSkips: ({
      guildId,
      quests,
      skipped,
    }: {
      guildId: Guild['id'];
      quests: QuestListItem[];
      skipped: SkippedQuestFile[];
    }): void => {
      orchestrator.listQuestsWithSkipsReturns({ guildId, quests, skipped });
    },
    setupListQuestsError: ({
      guildId,
      message,
    }: {
      guildId: Guild['id'];
      message: string;
    }): void => {
      orchestrator.listQuestsWithSkipsThrows({ guildId, error: NativeErrorStub({ message }) });
    },
    callResponder: QuestListResponder,
  };
};
