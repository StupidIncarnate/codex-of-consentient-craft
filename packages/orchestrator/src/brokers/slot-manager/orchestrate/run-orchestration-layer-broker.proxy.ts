import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { orchestrationLoopLayerBrokerProxy } from './orchestration-loop-layer-broker.proxy';

export const runOrchestrationLayerBrokerProxy = (): {
  getWorkTracker: () => ReturnType<typeof WorkTrackerStub>;
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupAutoEmitLines: ReturnType<typeof orchestrationLoopLayerBrokerProxy>['setupAutoEmitLines'];
  setupSpawnFailure: () => void;
  setAutoReplayLines: (params: { lines: readonly string[] }) => void;
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
    setupSpawnOnce: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      loopProxy.setupSpawnOnce({ lines, exitCode });
    },
    setupAutoEmitLines: loopProxy.setupAutoEmitLines,
    setupSpawnFailure: (): void => {
      loopProxy.setupSpawnFailure();
    },
    setAutoReplayLines: ({ lines }: { lines: readonly string[] }): void => {
      loopProxy.setAutoReplayLines({ lines });
    },
  };
};
