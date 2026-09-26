import { orchestratorBootstrapAdapterProxy } from '../../../adapters/orchestrator/bootstrap/orchestrator-bootstrap-adapter.proxy';
import { OrchestrationBootstrapResponder } from './orchestration-bootstrap-responder';

export const OrchestrationBootstrapResponderProxy = (): {
  setupSuccess: () => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationBootstrapResponder;
} => {
  const adapterProxy = orchestratorBootstrapAdapterProxy();

  return {
    setupSuccess: (): void => {
      adapterProxy.succeeds();
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: OrchestrationBootstrapResponder,
  };
};
