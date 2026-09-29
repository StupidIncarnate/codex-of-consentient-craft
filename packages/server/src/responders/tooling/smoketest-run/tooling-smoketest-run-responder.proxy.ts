import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { configRootFindBrokerProxy } from '@dungeonmaster/shared/brokers/config-root/find/config-root-find-broker.proxy';
import type { SmoketestSuite } from '@dungeonmaster/shared/contracts';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';

// Matches the cwd() stub below — configRootFindBrokerProxy has no constructor catch-all of its
// own, so the responder's cwd -> config-root walk must be addressed explicitly.
const DEFAULT_CWD = '/default/cwd';

export const ToolingSmoketestRunResponderProxy = (): {
  setupAlreadyRunning: (params: { runId: string; suite: SmoketestSuite }) => void;
  setupRejectsWith: (params: { suite: SmoketestSuite; error: Error }) => void;
} => {
  const orchestrator = StartOrchestratorProxy();
  const configRootProxy = configRootFindBrokerProxy();
  const cwdStageProxy = cwdProxy();
  // Staged rather than left to the real value because configRootProxy below addresses its own
  // stage by this EXACT startPath string.
  cwdStageProxy.setupCwd({ value: DEFAULT_CWD });

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
