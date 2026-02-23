import { orchestratorGetQuestStatusAdapterProxy } from '../../../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter.proxy';
import type { OrchestrationStatusStub } from '@dungeonmaster/shared/contracts';
import { ProcessStatusResponder } from './process-status-responder';

type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;

export const ProcessStatusResponderProxy = (): {
  setupGetStatus: (params: { status: OrchestrationStatus }) => void;
  setupGetStatusError: (params: { message: string }) => void;
  callResponder: typeof ProcessStatusResponder;
} => {
  const adapterProxy = orchestratorGetQuestStatusAdapterProxy();

  return {
    setupGetStatus: ({ status }: { status: OrchestrationStatus }): void => {
      adapterProxy.returns({ status });
    },
    setupGetStatusError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: ProcessStatusResponder,
  };
};
