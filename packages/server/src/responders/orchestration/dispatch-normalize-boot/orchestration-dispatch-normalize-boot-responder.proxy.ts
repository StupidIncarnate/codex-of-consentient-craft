import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
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
      orchestrator.normalizeDispatchBootThrows({ error: NativeErrorStub({ message }) });
    },
    callResponder: OrchestrationDispatchNormalizeBootResponder,
  };
};
