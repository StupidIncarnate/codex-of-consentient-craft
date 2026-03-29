import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorReplayChatHistoryAdapterProxy = (): {
  setupSuccess: () => void;
  setupFailure: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.replayChatHistory });
  mock.mockResolvedValue(undefined);

  return {
    setupSuccess: (): void => {
      mock.mockResolvedValue(undefined);
    },
    setupFailure: ({ error }: { error: Error }): void => {
      mock.mockImplementation(async () => Promise.reject(error));
    },
  };
};
