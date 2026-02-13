import type { OrchestrationStatusStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { processStatusBrokerProxy } from '../../brokers/process/status/process-status-broker.proxy';
import { questStartBrokerProxy } from '../../brokers/quest/start/quest-start-broker.proxy';
import { agentOutputStateProxy } from '../../state/agent-output/agent-output-state.proxy';

type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;

export const useExecutionBindingProxy = (): {
  setupStart: (params: { processId: ProcessId }) => void;
  setupStatus: (params: { status: OrchestrationStatus }) => void;
  setupStartError: () => void;
  setupStatusError: () => void;
  setupInvalidStartResponse: () => void;
  receiveWsMessage: (params: { data: string }) => void;
} => {
  const startProxy = questStartBrokerProxy();
  const statusProxy = processStatusBrokerProxy();
  const wsProxy = websocketConnectAdapterProxy();
  const stateProxy = agentOutputStateProxy();

  stateProxy.setupEmptyOutput();

  return {
    setupStart: ({ processId }: { processId: ProcessId }): void => {
      startProxy.setupStart({ processId });
    },
    setupStatus: ({ status }: { status: OrchestrationStatus }): void => {
      statusProxy.setupStatus({ status });
    },
    setupStartError: (): void => {
      startProxy.setupError();
    },
    setupStatusError: (): void => {
      statusProxy.setupError();
    },
    setupInvalidStartResponse: (): void => {
      startProxy.setupInvalidResponse({ data: {} });
    },
    receiveWsMessage: ({ data }: { data: string }): void => {
      wsProxy.receiveMessage({ data });
    },
  };
};
