import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { configRootFindBrokerProxy, processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import type { SmoketestSuite } from '@dungeonmaster/shared/contracts';

// Matches processCwdAdapterProxy's own default — configRootFindBrokerProxy has no constructor
// catch-all of its own, so the responder's cwd -> config-root walk must be addressed explicitly.
const DEFAULT_CWD = '/default/cwd';

export const ToolingSmoketestRunResponderProxy = (): {
  setupAlreadyRunning: (params: { runId: string; suite: SmoketestSuite }) => void;
  setupRejectsWith: (params: { suite: SmoketestSuite; error: Error }) => void;
} => {
  const orchestrator = StartOrchestratorProxy();
  const configRootProxy = configRootFindBrokerProxy();
  processCwdAdapterProxy();

  configRootProxy.setupConfigRootFound({ startPath: DEFAULT_CWD, configRootPath: DEFAULT_CWD });

  return {
    setupAlreadyRunning: ({ runId, suite }: { runId: string; suite: SmoketestSuite }): void => {
      orchestrator.runSmoketestThrows({
        suite,
        error: new Error(`Smoketest already running (runId=${runId}, suite=${suite})`),
      });
    },
    setupRejectsWith: ({ suite, error }: { suite: SmoketestSuite; error: Error }): void => {
      orchestrator.runSmoketestThrows({ suite, error });
    },
  };
};
