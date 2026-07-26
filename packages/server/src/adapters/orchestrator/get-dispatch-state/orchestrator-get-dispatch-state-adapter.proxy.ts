import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

type DispatchState = ReturnType<typeof DispatchStateStub>;

// getDispatchState takes no arguments — `[]` is the exhaustive, honest address. The constructor
// default answers callers that never set up their own scenario, same as the old blanket default.
export const orchestratorGetDispatchStateAdapterProxy = (): {
  returns: (params: { state: DispatchState }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getDispatchState });

  mock.calledWith([]).resolves(DispatchStateStub());

  return {
    returns: ({ state }: { state: DispatchState }): void => {
      mock.calledWith([]).resolves(state);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.calledWith([]).rejects(error);
    },
  };
};
