import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
import { OrchestrationDispatchGetResponder } from './orchestration-dispatch-get-responder';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const OrchestrationDispatchGetResponderProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationDispatchGetResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupState: ({ state }: { state: DispatchState }): void => {
      orchestrator.getDispatchStateReturns({ state });
    },
    setupError: ({ message }: { message: string }): void => {
      orchestrator.getDispatchStateThrows({ error: NativeErrorStub({ message }) });
    },
    callResponder: OrchestrationDispatchGetResponder,
  };
};
