import type { OrchestrationModeStub } from '@dungeonmaster/shared/contracts/orchestration-mode/orchestration-mode.stub';

import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { OrchestrationModeGetResponder } from './orchestration-mode-get-responder';

type OrchestrationMode = ReturnType<typeof OrchestrationModeStub>;

export const OrchestrationModeGetResponderProxy = (): {
  setupMode: (params: { mode: OrchestrationMode }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationModeGetResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupMode: ({ mode }: { mode: OrchestrationMode }): void => {
      orchestrator.getOrchestrationModeReturns({ mode });
    },
    setupError: ({ message }: { message: string }): void => {
      orchestrator.getOrchestrationModeThrows({ error: new Error(message) });
    },
    callResponder: OrchestrationModeGetResponder,
  };
};
