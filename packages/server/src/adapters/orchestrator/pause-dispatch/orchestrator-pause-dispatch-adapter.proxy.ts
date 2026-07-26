import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const orchestratorPauseDispatchAdapterProxy = (): {
  returns: (params: { state: DispatchState }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.pauseDispatch });

  return {
    // pauseDispatch takes no argument — [] is the honest, non-catch-all address.
    returns: ({ state }: { state: DispatchState }): void => {
      mock.calledWith([]).resolves(state);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.calledWith([]).rejects(error);
    },
  };
};
