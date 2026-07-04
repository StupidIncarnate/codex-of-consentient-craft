import { orchestratorPauseDispatchAdapterProxy } from '../../../adapters/orchestrator/pause-dispatch/orchestrator-pause-dispatch-adapter.proxy';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { OrchestrationDispatchPauseResponder } from './orchestration-dispatch-pause-responder';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const OrchestrationDispatchPauseResponderProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationDispatchPauseResponder;
} => {
  const adapterProxy = orchestratorPauseDispatchAdapterProxy();

  return {
    setupState: ({ state }: { state: DispatchState }): void => {
      adapterProxy.returns({ state });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: OrchestrationDispatchPauseResponder,
  };
};
