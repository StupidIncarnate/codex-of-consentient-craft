jest.mock('@dungeonmaster/orchestrator', () => ({
  ...jest.requireActual('@dungeonmaster/orchestrator'),
  StartOrchestrator: {
    loadQuest: jest.fn(),
    replayChatHistory: jest.fn(),
    stopAllChats: jest.fn(),
  },
  orchestrationEventsState: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { QuestStub } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const orchestratorLoadQuestAdapterProxy = (): {
  returns: (params: { quest: Quest }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.loadQuest);
  mock.mockResolvedValue(QuestStub());

  return {
    returns: ({ quest }: { quest: Quest }): void => {
      mock.mockResolvedValueOnce(quest);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
