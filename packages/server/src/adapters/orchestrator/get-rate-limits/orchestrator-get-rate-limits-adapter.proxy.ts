import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

type RateLimitsSnapshot = ReturnType<typeof RateLimitsSnapshotStub>;

export const orchestratorGetRateLimitsAdapterProxy = (): {
  returns: (params: { snapshot: RateLimitsSnapshot | null }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getRateLimits });

  mock.mockReturnValue(null);

  return {
    returns: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }): void => {
      mock.mockReturnValueOnce(snapshot);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
