import { questFindQuestPathBroker } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath, GuildId, QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorFindQuestPathAdapterProxy = (): {
  returns: (params: { questId: QuestId; questPath: AbsoluteFilePath; guildId: GuildId }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: questFindQuestPathBroker });

  return {
    returns: ({
      questId,
      questPath,
      guildId,
    }: {
      questId: QuestId;
      questPath: AbsoluteFilePath;
      guildId: GuildId;
    }): void => {
      mock.calledWith([{ questId }]).resolves({ questPath, guildId });
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
  };
};
