import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { DispatchPlayResponseStub } from '@dungeonmaster/orchestrator/testing';

type DispatchPlayResponse = ReturnType<typeof DispatchPlayResponseStub>;

export const orchestratorPlayDispatchAdapterProxy = (): {
  returns: (params: { response: DispatchPlayResponse }) => void;
  throws: (params: { error: Error }) => void;
  getCalls: () => readonly unknown[];
} => {
  const mock = registerMock({ fn: StartOrchestrator.playDispatch });

  return {
    // playDispatch takes an optional { force } — but the response never varies by force in any
    // caller, so [] (match every call) is the honest address for the return value. getCalls()
    // below is what actually verifies which force value was forwarded per call.
    returns: ({ response }: { response: DispatchPlayResponse }): void => {
      mock.calledWith([]).resolves(response);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.calledWith([]).rejects(error);
    },
    getCalls: (): readonly unknown[] => mock.callsMatching([]).map((call) => call[0]),
  };
};
