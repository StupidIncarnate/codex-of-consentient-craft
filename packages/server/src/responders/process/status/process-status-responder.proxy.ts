import { orchestratorGetQuestStatusAdapterProxy } from '../../../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter.proxy';
import type { OrchestrationStatusStub, ProcessId } from '@dungeonmaster/shared/contracts';
import { ProcessStatusResponder } from './process-status-responder';

type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;

export const ProcessStatusResponderProxy = (): {
  setupGetStatus: (params: { status: OrchestrationStatus }) => void;
  setupGetStatusError: (params: { processId: ProcessId; message: string }) => void;
  callResponder: typeof ProcessStatusResponder;
} => {
  const adapterProxy = orchestratorGetQuestStatusAdapterProxy();

  return {
    setupGetStatus: ({ status }: { status: OrchestrationStatus }): void => {
      adapterProxy.returns({ processId: status.processId, status });
    },
    setupGetStatusError: ({
      processId,
      message,
    }: {
      processId: ProcessId;
      message: string;
    }): void => {
      adapterProxy.throws({ processId, error: new Error(message) });
    },
    callResponder: ProcessStatusResponder,
  };
};
