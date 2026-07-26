import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type {
  GuildId,
  QuestListItemStub,
  SkippedQuestFileStub,
} from '@dungeonmaster/shared/contracts';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type SkippedQuestFile = ReturnType<typeof SkippedQuestFileStub>;

export const orchestratorListQuestsWithSkipsAdapterProxy = (): {
  returns: (params: {
    guildId: GuildId;
    quests: QuestListItem[];
    skipped: SkippedQuestFile[];
  }) => void;
  throws: (params: { guildId: GuildId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.listQuestsWithSkips });

  return {
    returns: ({
      guildId,
      quests,
      skipped,
    }: {
      guildId: GuildId;
      quests: QuestListItem[];
      skipped: SkippedQuestFile[];
    }): void => {
      mock.calledWith([{ guildId }]).resolves({ quests, skipped });
    },
    throws: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      mock.calledWith([{ guildId }]).rejects(error);
    },
  };
};
