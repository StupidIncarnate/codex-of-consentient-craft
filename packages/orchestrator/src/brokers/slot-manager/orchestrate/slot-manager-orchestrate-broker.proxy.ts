import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { runOrchestrationLayerBrokerProxy } from './run-orchestration-layer-broker.proxy';

export const slotManagerOrchestrateBrokerProxy = (): {
  getWorkTracker: () => ReturnType<typeof WorkTrackerStub>;
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnFailure: () => void;
} => {
  const runOrchestrationProxy = runOrchestrationLayerBrokerProxy();

  return {
    getWorkTracker: () => runOrchestrationProxy.getWorkTracker(),
    setupSpawnAndMonitor: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      runOrchestrationProxy.setupSpawnAndMonitor({ lines, exitCode });
    },
    setupSpawnFailure: (): void => {
      runOrchestrationProxy.setupSpawnFailure();
    },
  };
};
