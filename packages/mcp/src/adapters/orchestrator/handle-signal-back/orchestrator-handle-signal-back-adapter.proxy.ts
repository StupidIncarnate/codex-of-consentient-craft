import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { AdapterResultStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type AdapterResult = ReturnType<typeof AdapterResultStub>;

export const orchestratorHandleSignalBackAdapterProxy = (): {
  resolves: (params: { result: AdapterResult }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.handleSignalBack });

  handle.mockResolvedValue(AdapterResultStub());

  return {
    resolves: ({ result }: { result: AdapterResult }): void => {
      handle.mockResolvedValueOnce(result);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
