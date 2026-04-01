import { orchestratorClarifyAdapterProxy } from '../../../adapters/orchestrator/clarify/orchestrator-clarify-adapter.proxy';
import { SessionClarifyResponder } from './session-clarify-responder';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const SessionClarifyResponderProxy = (): {
  setupClarify: (params: { chatProcessId: ProcessId }) => void;
  setupError: (params: { message: string }) => void;
  setupNonErrorThrow: () => void;
  callResponder: typeof SessionClarifyResponder;
} => {
  const adapterProxy = orchestratorClarifyAdapterProxy();

  return {
    setupClarify: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      adapterProxy.returns({ chatProcessId });
    },
    setupError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    setupNonErrorThrow: (): void => {
      adapterProxy.throws({ error: 'string-not-error-instance' as never });
    },
    callResponder: SessionClarifyResponder,
  };
};
