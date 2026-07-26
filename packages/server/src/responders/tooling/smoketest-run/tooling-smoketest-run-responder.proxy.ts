import { configRootFindBrokerProxy, processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import type { SmoketestSuite } from '@dungeonmaster/shared/contracts';

import { orchestratorRunSmoketestAdapterProxy } from '../../../adapters/orchestrator/run-smoketest/orchestrator-run-smoketest-adapter.proxy';

// Matches processCwdAdapterProxy's own default — configRootFindBrokerProxy has no constructor
// catch-all of its own, so the responder's cwd -> config-root walk must be addressed explicitly.
const DEFAULT_CWD = '/default/cwd';

export const ToolingSmoketestRunResponderProxy = (): {
  setupAlreadyRunning: (params: { runId: string; suite: SmoketestSuite }) => void;
  setupRejectsWith: (params: { suite: SmoketestSuite; error: Error }) => void;
} => {
  const adapterProxy = orchestratorRunSmoketestAdapterProxy();
  const configRootProxy = configRootFindBrokerProxy();
  processCwdAdapterProxy();

  configRootProxy.setupConfigRootFound({ startPath: DEFAULT_CWD, configRootPath: DEFAULT_CWD });

  return {
    setupAlreadyRunning: ({ runId, suite }: { runId: string; suite: SmoketestSuite }): void => {
      adapterProxy.throws({
        suite,
        error: new Error(`Smoketest already running (runId=${runId}, suite=${suite})`),
      });
    },
    setupRejectsWith: ({ suite, error }: { suite: SmoketestSuite; error: Error }): void => {
      adapterProxy.throws({ suite, error });
    },
  };
};
