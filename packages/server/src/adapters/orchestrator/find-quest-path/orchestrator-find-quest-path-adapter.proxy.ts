jest.mock('@dungeonmaster/orchestrator', () => ({
  ...jest.requireActual('@dungeonmaster/orchestrator'),
  StartOrchestrator: {
    listQuests: jest.fn(),
    loadQuest: jest.fn(),
    recoverActiveQuests: jest.fn(),
    replayChatHistory: jest.fn(),
    stopAllChats: jest.fn(),
  },
  orchestrationEventsState: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  questFindQuestPathBroker: jest.fn(),
}));

import * as orchestrator from '@dungeonmaster/orchestrator';
import type { AbsoluteFilePath, GuildId } from '@dungeonmaster/shared/contracts';

export const orchestratorFindQuestPathAdapterProxy = (): {
  returns: (params: { questPath: AbsoluteFilePath; guildId: GuildId }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(orchestrator.questFindQuestPathBroker);
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
