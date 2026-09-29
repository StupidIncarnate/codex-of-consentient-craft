import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
import { OrchestrationDispatchPauseResponder } from './orchestration-dispatch-pause-responder';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const OrchestrationDispatchPauseResponderProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationDispatchPauseResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupState: ({ state }: { state: DispatchState }): void => {
      orchestrator.pauseDispatchReturns({ state });
    },
    setupError: ({ message }: { message: string }): void => {
      orchestrator.pauseDispatchThrows({ error: new Error(message) });
    },
    callResponder: OrchestrationDispatchPauseResponder,
  };
};
