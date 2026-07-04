import { orchestratorGetDispatchStateAdapterProxy } from '../../../adapters/orchestrator/get-dispatch-state/orchestrator-get-dispatch-state-adapter.proxy';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { OrchestrationDispatchGetResponder } from './orchestration-dispatch-get-responder';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const OrchestrationDispatchGetResponderProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationDispatchGetResponder;
} => {
  const adapterProxy = orchestratorGetDispatchStateAdapterProxy();

  return {
    setupState: ({ state }: { state: DispatchState }): void => {
      adapterProxy.returns({ state });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: OrchestrationDispatchGetResponder,
  };
};
