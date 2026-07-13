import type { AdapterResultStub } from '@dungeonmaster/shared/contracts';

import { orchestratorHandleSignalBackAdapterProxy } from '../../../adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.proxy';
import { QuestSignalBackResponder } from './quest-signal-back-responder';

type AdapterResult = ReturnType<typeof AdapterResultStub>;

export const QuestSignalBackResponderProxy = (): {
  setupSignalBack: (params: { result: AdapterResult }) => void;
  setupSignalBackError: (params: { message: string }) => void;
  callResponder: typeof QuestSignalBackResponder;
} => {
  const adapterProxy = orchestratorHandleSignalBackAdapterProxy();

  return {
    setupSignalBack: ({ result }: { result: AdapterResult }): void => {
      adapterProxy.resolves({ result });
    },
    setupSignalBackError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: QuestSignalBackResponder,
  };
};
