import { orchestratorPlayDispatchAdapterProxy } from '../../../adapters/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter.proxy';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { OrchestrationDispatchPlayResponder } from './orchestration-dispatch-play-responder';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const OrchestrationDispatchPlayResponderProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationDispatchPlayResponder;
} => {
  const adapterProxy = orchestratorPlayDispatchAdapterProxy();

  return {
    setupState: ({ state }: { state: DispatchState }): void => {
      adapterProxy.returns({ state });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: OrchestrationDispatchPlayResponder,
  };
};
