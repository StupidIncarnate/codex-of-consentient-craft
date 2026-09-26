import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// bootstrap takes no arguments, so `[]` is the exhaustive, honest address. No constructor default:
// a test that reaches bootstrap without staging it should fail loudly, not pass on an invented success.
export const orchestratorBootstrapAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.bootstrap });

  return {
    succeeds: (): void => {
      mock.calledWith([]).returns({ success: true });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.calledWith([]).throws(error);
    },
  };
};
