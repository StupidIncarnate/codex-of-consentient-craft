import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { OrchestrationBootstrapResponder } from './orchestration-bootstrap-responder';

export const OrchestrationBootstrapResponderProxy = (): {
  setupSuccess: () => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationBootstrapResponder;
  // The SAME underlying mock StartOrchestratorProxy stages `bootstrapSucceeds`/`bootstrapThrows`
  // on — registerMock is shared across every proxy mocking the same function — so this proves the
  // responder really delegates, rather than a void return proving nothing.
  getBootstrapCalls: () => RecordedCalls;
} => {
  const orchestrator = StartOrchestratorProxy();
  const bootstrapHandle = registerMock({ fn: StartOrchestrator.bootstrap });

  return {
    setupSuccess: (): void => {
      orchestrator.bootstrapSucceeds();
    },
    setupError: ({ message }: { message: string }): void => {
      orchestrator.bootstrapThrows({ error: new Error(message) });
    },
    callResponder: OrchestrationBootstrapResponder,
    getBootstrapCalls: (): RecordedCalls => bootstrapHandle.callsMatching([]),
  };
};
