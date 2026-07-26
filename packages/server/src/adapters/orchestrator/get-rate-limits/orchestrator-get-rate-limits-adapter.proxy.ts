import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

type RateLimitsSnapshot = ReturnType<typeof RateLimitsSnapshotStub>;

// getRateLimits takes no arguments — `[]` is the exhaustive, honest address (there is no other
// call shape it could ever receive). The constructor default answers callers that never set up
// a scenario of their own, exactly like the old blanket default did for this one address.
export const orchestratorGetRateLimitsAdapterProxy = (): {
  returns: (params: { snapshot: RateLimitsSnapshot | null }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getRateLimits });

  mock.calledWith([]).returns(null);

  return {
    returns: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }): void => {
      mock.calledWith([]).returns(snapshot);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.calledWith([]).throws(error);
    },
  };
};
