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

export const orchestratorReplayChatHistoryAdapterProxy = (): {
  setupSuccess: () => void;
  setupFailure: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.replayChatHistory);
  mock.mockResolvedValue(undefined);

  return {
    setupSuccess: (): void => {
      mock.mockResolvedValue(undefined);
    },
    setupFailure: ({ error }: { error: Error }): void => {
      mock.mockRejectedValue(error);
    },
  };
};
