import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { OrchestrationBootstrapResponder } from './orchestration-bootstrap-responder';

export const OrchestrationBootstrapResponderProxy = (): {
  setupSuccess: () => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationBootstrapResponder;
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
  };
};
