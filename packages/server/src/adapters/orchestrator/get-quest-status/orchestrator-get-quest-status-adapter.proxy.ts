import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { OrchestrationStatusStub } from '@dungeonmaster/shared/contracts';

type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;

export const orchestratorGetQuestStatusAdapterProxy = (): {
  returns: (params: { status: OrchestrationStatus }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getQuestStatus });

  mock.mockReturnValue(OrchestrationStatusStub());

  return {
    returns: ({ status }: { status: OrchestrationStatus }): void => {
      mock.mockReturnValueOnce(status);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
