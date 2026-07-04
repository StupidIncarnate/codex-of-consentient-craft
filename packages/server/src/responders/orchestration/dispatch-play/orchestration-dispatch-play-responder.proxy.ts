import { orchestratorPlayDispatchAdapterProxy } from '../../../adapters/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter.proxy';
import { DispatchPlayResponseStub } from '@dungeonmaster/orchestrator/testing';
import type { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { OrchestrationDispatchPlayResponder } from './orchestration-dispatch-play-responder';

type DispatchState = ReturnType<typeof DispatchStateStub>;

export const OrchestrationDispatchPlayResponderProxy = (): {
  setupAllowed: (params: { state: DispatchState }) => void;
  setupRefused: (params: { reason: string; state: DispatchState }) => void;
  setupError: (params: { message: string }) => void;
  getAdapterCalls: () => readonly unknown[];
  callResponder: typeof OrchestrationDispatchPlayResponder;
} => {
  const adapterProxy = orchestratorPlayDispatchAdapterProxy();

  return {
    setupAllowed: ({ state }: { state: DispatchState }): void => {
      adapterProxy.returns({ response: DispatchPlayResponseStub({ allowed: true, state }) });
    },
    setupRefused: ({ reason, state }: { reason: string; state: DispatchState }): void => {
      adapterProxy.returns({
        response: DispatchPlayResponseStub({ allowed: false, reason: reason as never, state }),
      });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    getAdapterCalls: (): readonly unknown[] => adapterProxy.getCalls(),
    callResponder: OrchestrationDispatchPlayResponder,
  };
};
