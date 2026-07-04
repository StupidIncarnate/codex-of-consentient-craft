import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const orchestratorGetDispatchStateAdapterProxy = (): {
  returns: (params: { state: DispatchState }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getDispatchState });

  mock.mockResolvedValue(DispatchStateStub());

  return {
    returns: ({ state }: { state: DispatchState }): void => {
      mock.mockResolvedValueOnce(state);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
