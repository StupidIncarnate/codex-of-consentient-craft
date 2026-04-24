import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type RunSmoketestResult = Awaited<ReturnType<typeof StartOrchestrator.runSmoketest>>;

export const orchestratorRunSmoketestAdapterProxy = (): {
  returns: (params: { result: RunSmoketestResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.runSmoketest });

  mock.mockResolvedValue({
    runId: 'stub-run' as never,
    enqueued: [],
    results: [],
  } as never);

  return {
    returns: ({ result }: { result: RunSmoketestResult }): void => {
      mock.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
