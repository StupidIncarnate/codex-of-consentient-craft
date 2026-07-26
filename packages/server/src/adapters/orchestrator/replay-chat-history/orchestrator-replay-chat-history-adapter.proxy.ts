import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorReplayChatHistoryAdapterProxy = (): {
  setupSuccess: () => void;
  setupFailure: (params: { error: Error }) => void;
  getAllCalledArgs: () => unknown[];
} => {
  const mock = registerMock({ fn: StartOrchestrator.replayChatHistory });

  return {
    // No address: the adapter discards whatever replayChatHistory resolves to (it always
    // returns `{ success: true }` itself), and the sole external caller
    // (server-init-responder.proxy.ts) sets up a blanket success/failure without ever knowing
    // which session the flow under test resolves to. `[]` matches every call honestly here.
    setupSuccess: (): void => {
      mock.calledWith([]).resolves(undefined);
    },
    setupFailure: ({ error }: { error: Error }): void => {
      mock.calledWith([]).rejects(error);
    },
    getAllCalledArgs: (): unknown[] => mock.callsMatching([]).map((call) => call[0]),
  };
};
