// PURPOSE: Proxy for orchestrator-get-quest-status-broker that mocks shared fetch + port resolution
// USAGE: const proxy = orchestratorGetQuestStatusBrokerProxy(); proxy.returns({ processId, status: OrchestrationStatusStub() });

import type { OrchestrationStatusStub, ProcessId } from '@dungeonmaster/shared/contracts';
import { fetchGetAdapterProxy, portResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import { environmentStatics } from '@dungeonmaster/shared/statics';

type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;

const PORT = '4750';

export const orchestratorGetQuestStatusBrokerProxy = (): {
  returns: (params: { processId: ProcessId; status: OrchestrationStatus }) => void;
  throws: (params: { processId: ProcessId; error: Error }) => void;
} => {
  const fetchProxy = fetchGetAdapterProxy();
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: PORT });

  return {
    // Keyed on the URL the broker actually fetches: hostname + the fixed mocked port +
    // /api/process/<processId>. processId is the only part of that URL a caller can vary.
    returns: ({
      processId,
      status,
    }: {
      processId: ProcessId;
      status: OrchestrationStatus;
    }): void => {
      const url = `http://${environmentStatics.hostname}:${PORT}/api/process/${processId}`;
      fetchProxy.setupSuccess({ url, body: status });
    },
    throws: ({ processId, error }: { processId: ProcessId; error: Error }): void => {
      const url = `http://${environmentStatics.hostname}:${PORT}/api/process/${processId}`;
      fetchProxy.setupNotOk({
        url,
        status: 500,
        bodyText: JSON.stringify({ error: error.message }),
      });
    },
  };
};
