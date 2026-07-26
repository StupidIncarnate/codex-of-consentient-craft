import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { OrchestrationModeStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type OrchestrationMode = ReturnType<typeof OrchestrationModeStub>;

export const orchestratorGetOrchestrationModeAdapterProxy = (): {
  returns: (params: { mode: OrchestrationMode }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getOrchestrationMode });

  return {
    // getOrchestrationMode takes no argument — [] is the honest, non-catch-all address.
    returns: ({ mode }: { mode: OrchestrationMode }): void => {
      mock.calledWith([]).resolves(mode);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.calledWith([]).rejects(error);
    },
  };
};
