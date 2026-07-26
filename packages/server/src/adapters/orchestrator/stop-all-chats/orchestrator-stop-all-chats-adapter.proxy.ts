import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// StartOrchestrator.stopAllChats takes no arguments — calledWith([]) is the honest description
// of that call, not a wildcard standing in for a missing address.
export const orchestratorStopAllChatsAdapterProxy = (): {
  throws: (params: { error: Error }) => void;
  wasCalled: () => boolean;
} => {
  const mock = registerMock({ fn: StartOrchestrator.stopAllChats });

  // stopAllChats() takes no arguments, so calledWith([]) is the only call shape that ever
  // exists — default it to a quiet success; the error test overrides with a later staging.
  mock.calledWith([]).returns(undefined);

  return {
    throws: ({ error }: { error: Error }): void => {
      mock.calledWith([]).throws(error);
    },
    wasCalled: (): boolean => mock.callsMatching([]).length > 0,
  };
};
