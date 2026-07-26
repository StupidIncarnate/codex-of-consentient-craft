import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { SmoketestSuite } from '@dungeonmaster/shared/contracts';

type RunSmoketestResult = Awaited<ReturnType<typeof StartOrchestrator.runSmoketest>>;

export const orchestratorRunSmoketestAdapterProxy = (): {
  returns: (params: { suite: SmoketestSuite; result: RunSmoketestResult }) => void;
  throws: (params: { suite: SmoketestSuite; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.runSmoketest });

  return {
    returns: ({ suite, result }: { suite: SmoketestSuite; result: RunSmoketestResult }): void => {
      mock.calledWith([{ suite }]).resolves(result);
    },
    throws: ({ suite, error }: { suite: SmoketestSuite; error: Error }): void => {
      mock.calledWith([{ suite }]).rejects(error);
    },
  };
};
