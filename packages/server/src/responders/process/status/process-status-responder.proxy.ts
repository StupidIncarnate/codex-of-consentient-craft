import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { OrchestrationStatusStub, ProcessId } from '@dungeonmaster/shared/contracts';
import { ProcessStatusResponder } from './process-status-responder';

type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;

export const ProcessStatusResponderProxy = (): {
  setupGetStatus: (params: { status: OrchestrationStatus }) => void;
  setupGetStatusError: (params: { processId: ProcessId; message: string }) => void;
  callResponder: typeof ProcessStatusResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupGetStatus: ({ status }: { status: OrchestrationStatus }): void => {
      orchestrator.getQuestStatusReturns({ processId: status.processId, status });
    },
    setupGetStatusError: ({
      processId,
      message,
    }: {
      processId: ProcessId;
      message: string;
    }): void => {
      orchestrator.getQuestStatusThrows({ processId, error: new Error(message) });
    },
    callResponder: ProcessStatusResponder,
  };
};
