// PURPOSE: Proxy for orchestrator-get-quest-status-broker that mocks shared fetch + port resolution
// USAGE: const proxy = orchestratorGetQuestStatusBrokerProxy(); proxy.returns({ status: OrchestrationStatusStub() });

import type { OrchestrationStatusStub } from '@dungeonmaster/shared/contracts';
import { fetchGetAdapterProxy, portResolveBrokerProxy } from '@dungeonmaster/shared/testing';

type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;

export const orchestratorGetQuestStatusBrokerProxy = (): {
  returns: (params: { status: OrchestrationStatus }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const fetchProxy = fetchGetAdapterProxy();
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: '4750' });

  return {
    returns: ({ status }: { status: OrchestrationStatus }): void => {
      fetchProxy.setupSuccess({ body: status });
    },
    throws: ({ error }: { error: Error }): void => {
      fetchProxy.setupNotOk({ status: 500, bodyText: JSON.stringify({ error: error.message }) });
    },
  };
};
