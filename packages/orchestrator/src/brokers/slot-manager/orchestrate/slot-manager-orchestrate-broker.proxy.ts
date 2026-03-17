import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { runOrchestrationLayerBrokerProxy } from './run-orchestration-layer-broker.proxy';

export const slotManagerOrchestrateBrokerProxy = (): {
  getWorkTracker: () => ReturnType<typeof WorkTrackerStub>;
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupAutoEmitLines: ReturnType<typeof runOrchestrationLayerBrokerProxy>['setupAutoEmitLines'];
  setupSpawnFailure: () => void;
  setAutoReplayLines: (params: { lines: readonly string[] }) => void;
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
    setupSpawnOnce: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      runOrchestrationProxy.setupSpawnOnce({ lines, exitCode });
    },
    setupAutoEmitLines: runOrchestrationProxy.setupAutoEmitLines,
    setupSpawnFailure: (): void => {
      runOrchestrationProxy.setupSpawnFailure();
    },
    setAutoReplayLines: ({ lines }: { lines: readonly string[] }): void => {
      runOrchestrationProxy.setAutoReplayLines({ lines });
    },
  };
};
