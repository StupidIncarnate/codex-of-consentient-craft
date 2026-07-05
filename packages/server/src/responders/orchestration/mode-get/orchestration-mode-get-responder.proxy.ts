import type { OrchestrationModeStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetOrchestrationModeAdapterProxy } from '../../../adapters/orchestrator/get-orchestration-mode/orchestrator-get-orchestration-mode-adapter.proxy';
import { OrchestrationModeGetResponder } from './orchestration-mode-get-responder';

type OrchestrationMode = ReturnType<typeof OrchestrationModeStub>;

export const OrchestrationModeGetResponderProxy = (): {
  setupMode: (params: { mode: OrchestrationMode }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationModeGetResponder;
} => {
  const adapterProxy = orchestratorGetOrchestrationModeAdapterProxy();

  return {
    setupMode: ({ mode }: { mode: OrchestrationMode }): void => {
      adapterProxy.returns({ mode });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: OrchestrationModeGetResponder,
  };
};
