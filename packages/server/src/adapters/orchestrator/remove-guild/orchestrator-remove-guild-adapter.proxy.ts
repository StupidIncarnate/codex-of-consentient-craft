import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorRemoveGuildAdapterProxy = (): {
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.removeGuild });

  mock.mockResolvedValue({ success: true as const });

  return {
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
