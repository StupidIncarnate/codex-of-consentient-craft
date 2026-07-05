import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { OrchestrationModeStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type OrchestrationMode = ReturnType<typeof OrchestrationModeStub>;

export const orchestratorGetOrchestrationModeAdapterProxy = (): {
  returns: (params: { mode: OrchestrationMode }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getOrchestrationMode });

  mock.mockResolvedValue(OrchestrationModeStub());

  return {
    returns: ({ mode }: { mode: OrchestrationMode }): void => {
      mock.mockResolvedValueOnce(mode);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
