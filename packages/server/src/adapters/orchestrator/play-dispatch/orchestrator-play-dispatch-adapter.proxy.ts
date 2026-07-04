import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { DispatchPlayResponseStub } from '@dungeonmaster/orchestrator/testing';

type DispatchPlayResponse = ReturnType<typeof DispatchPlayResponseStub>;

export const orchestratorPlayDispatchAdapterProxy = (): {
  returns: (params: { response: DispatchPlayResponse }) => void;
  throws: (params: { error: Error }) => void;
  getCalls: () => readonly unknown[];
} => {
  const mock = registerMock({ fn: StartOrchestrator.playDispatch });

  mock.mockResolvedValue(DispatchPlayResponseStub());

  return {
    returns: ({ response }: { response: DispatchPlayResponse }): void => {
      mock.mockResolvedValueOnce(response);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
    getCalls: (): readonly unknown[] => mock.mock.calls.map((call) => call[0]),
  };
};
