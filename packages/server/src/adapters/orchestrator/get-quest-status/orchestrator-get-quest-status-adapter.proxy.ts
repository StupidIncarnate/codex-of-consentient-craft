import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { OrchestrationStatusStub, ProcessId } from '@dungeonmaster/shared/contracts';

type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;

export const orchestratorGetQuestStatusAdapterProxy = (): {
  returns: (params: { processId: ProcessId; status: OrchestrationStatus }) => void;
  throws: (params: { processId: ProcessId; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.getQuestStatus });

  return {
    returns: ({
      processId,
      status,
    }: {
      processId: ProcessId;
      status: OrchestrationStatus;
    }): void => {
      mock.calledWith([{ processId }]).returns(status);
    },
    throws: ({ processId, error }: { processId: ProcessId; error: Error }): void => {
      mock.calledWith([{ processId }]).throws(error);
    },
  };
};
