import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
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
      orchestrator.playDispatchThrows({ error: NativeErrorStub({ message }) });
    },
    callResponder: OrchestrationDispatchPlayResponder,
  };
};
