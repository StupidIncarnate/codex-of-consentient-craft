import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { OrchestrationDispatchPlayResponder } from './orchestration-dispatch-play-responder';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const OrchestrationDispatchPlayResponderProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationDispatchPlayResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupState: ({ state }: { state: DispatchState }): void => {
      orchestrator.playDispatchReturns({ state });
    },
    setupError: ({ message }: { message: string }): void => {
      orchestrator.playDispatchThrows({ error: new Error(message) });
    },
    callResponder: OrchestrationDispatchPlayResponder,
  };
};
