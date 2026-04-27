import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorReplayChatHistoryAdapterProxy = (): {
  setupSuccess: () => void;
  setupFailure: (params: { error: Error }) => void;
  getAllCalledArgs: () => unknown[];
} => {
  const mock = registerMock({ fn: StartOrchestrator.replayChatHistory });
  mock.mockResolvedValue({ success: true as const });

  return {
    setupSuccess: (): void => {
      mock.mockResolvedValue({ success: true as const });
    },
    setupFailure: ({ error }: { error: Error }): void => {
      mock.mockImplementation(async () => Promise.reject(error));
    },
    getAllCalledArgs: (): unknown[] => mock.mock.calls.map((call) => call[0]),
  };
};
