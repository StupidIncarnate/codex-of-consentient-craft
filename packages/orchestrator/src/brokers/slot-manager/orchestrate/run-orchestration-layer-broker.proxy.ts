import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { orchestrationLoopLayerBrokerProxy } from './orchestration-loop-layer-broker.proxy';

export const runOrchestrationLayerBrokerProxy = (): {
  getWorkTracker: () => ReturnType<typeof WorkTrackerStub>;
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnFailure: () => void;
} => {
  const loopProxy = orchestrationLoopLayerBrokerProxy();

  return {
    getWorkTracker: () => loopProxy.getWorkTracker(),
    setupSpawnAndMonitor: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      loopProxy.setupSpawnAndMonitor({ lines, exitCode });
    },
    setupSpawnFailure: (): void => {
      loopProxy.setupSpawnFailure();
    },
  };
};
