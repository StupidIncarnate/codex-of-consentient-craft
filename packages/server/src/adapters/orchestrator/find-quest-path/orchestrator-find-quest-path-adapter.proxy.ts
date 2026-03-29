import { questFindQuestPathBroker } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath, GuildId } from '@dungeonmaster/shared/contracts';

export const orchestratorFindQuestPathAdapterProxy = (): {
  returns: (params: { questPath: AbsoluteFilePath; guildId: GuildId }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: questFindQuestPathBroker });
  mock.mockResolvedValue({
    questPath: '/default/quest/path' as AbsoluteFilePath,
    guildId: 'default-guild' as GuildId,
  });

  return {
    returns: ({ questPath, guildId }: { questPath: AbsoluteFilePath; guildId: GuildId }): void => {
      mock.mockResolvedValueOnce({ questPath, guildId });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
