import { orchestratorNormalizeDispatchBootAdapterProxy } from '../../../adapters/orchestrator/normalize-dispatch-boot/orchestrator-normalize-dispatch-boot-adapter.proxy';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { OrchestrationDispatchNormalizeBootResponder } from './orchestration-dispatch-normalize-boot-responder';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const OrchestrationDispatchNormalizeBootResponderProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: (params: { message: string }) => void;
  callResponder: typeof OrchestrationDispatchNormalizeBootResponder;
} => {
  const adapterProxy = orchestratorNormalizeDispatchBootAdapterProxy();

  return {
    setupState: ({ state }: { state: DispatchState }): void => {
      adapterProxy.returns({ state });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: OrchestrationDispatchNormalizeBootResponder,
  };
};
