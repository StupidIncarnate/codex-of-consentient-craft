import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { OrchestrationDispatchNormalizeBootResponder } from './orchestration-dispatch-normalize-boot-responder';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const OrchestrationDispatchNormalizeBootResponderProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationDispatchNormalizeBootResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupState: ({ state }: { state: DispatchState }): void => {
      orchestrator.normalizeDispatchBootReturns({ state });
    },
    setupError: ({ message }: { message: string }): void => {
      orchestrator.normalizeDispatchBootThrows({ error: new Error(message) });
    },
    callResponder: OrchestrationDispatchNormalizeBootResponder,
  };
};
