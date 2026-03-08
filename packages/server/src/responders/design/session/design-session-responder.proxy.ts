import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import { orchestratorStartDesignChatAdapterProxy } from '../../../adapters/orchestrator/start-design-chat/orchestrator-start-design-chat-adapter.proxy';
import { DesignSessionResponder } from './design-session-responder';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const DesignSessionResponderProxy = (): {
  setupDesignChat: (params: { chatProcessId: ProcessId }) => void;
  setupDesignChatError: (params: { error: Error }) => void;
  callResponder: typeof DesignSessionResponder;
} => {
  const adapterProxy = orchestratorStartDesignChatAdapterProxy();

  return {
    setupDesignChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      adapterProxy.returns({ chatProcessId });
    },
    setupDesignChatError: ({ error }: { error: Error }): void => {
      adapterProxy.throws({ error });
    },
    callResponder: DesignSessionResponder,
  };
};
