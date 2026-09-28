import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { OrchestrationBootstrapResponder } from './orchestration-bootstrap-responder';

export const OrchestrationBootstrapResponderProxy = (): {
  setupSuccess: () => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationBootstrapResponder;
  // Proves the responder really delegates to StartOrchestrator.bootstrap, rather than a void
  // return proving nothing.
  getBootstrapCalls: () => RecordedCalls;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupSuccess: (): void => {
      orchestrator.bootstrapSucceeds();
    },
    setupError: ({ message }: { message: string }): void => {
      orchestrator.bootstrapThrows({ error: new Error(message) });
    },
    callResponder: OrchestrationBootstrapResponder,
    getBootstrapCalls: (): RecordedCalls => orchestrator.bootstrapGetCalls(),
  };
};
