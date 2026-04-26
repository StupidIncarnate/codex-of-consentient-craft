import { configRootFindBrokerProxy, processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

import { orchestratorRunSmoketestAdapterProxy } from '../../../adapters/orchestrator/run-smoketest/orchestrator-run-smoketest-adapter.proxy';

export const ToolingSmoketestRunResponderProxy = (): {
  setupAlreadyRunning: (params: { runId: string; suite: string }) => void;
  setupRejectsWith: (params: { error: Error }) => void;
} => {
  const adapterProxy = orchestratorRunSmoketestAdapterProxy();
  configRootFindBrokerProxy();
  processCwdAdapterProxy();
  return {
    setupAlreadyRunning: ({ runId, suite }: { runId: string; suite: string }): void => {
      adapterProxy.throws({
        error: new Error(`Smoketest already running (runId=${runId}, suite=${suite})`),
      });
    },
    setupRejectsWith: ({ error }: { error: Error }): void => {
      adapterProxy.throws({ error });
    },
  };
};
