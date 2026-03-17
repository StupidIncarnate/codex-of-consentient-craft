import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { handleSignalLayerBrokerProxy } from './handle-signal-layer-broker.proxy';
import { spawnAgentLayerBrokerProxy } from './spawn-agent-layer-broker.proxy';

export const orchestrationLoopLayerBrokerProxy = (): {
  getWorkTracker: () => ReturnType<typeof WorkTrackerStub>;
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupAutoEmitLines: ReturnType<typeof spawnAgentLayerBrokerProxy>['setupAutoEmitLines'];
  setupSpawnFailure: () => void;
  setAutoReplayLines: (params: { lines: readonly string[] }) => void;
  setupDateNow: (params: { timestamp: number }) => void;
} => {
  const spawnProxy = spawnAgentLayerBrokerProxy();
  handleSignalLayerBrokerProxy();

  const workTracker = WorkTrackerStub({
    markStarted: jest.fn().mockResolvedValue(undefined),
    markCompleted: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
    addWorkItem: jest.fn().mockReturnValue(undefined),
  });

  return {
    getWorkTracker: () => workTracker,
    setupSpawnAndMonitor: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      spawnProxy.setupSpawnAndMonitor({ lines, exitCode });
    },
    setupSpawnOnce: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      spawnProxy.setupSpawnOnce({ lines, exitCode });
    },
    setupAutoEmitLines: spawnProxy.setupAutoEmitLines,
    setupSpawnFailure: (): void => {
      spawnProxy.setupSpawnFailure();
    },
    setAutoReplayLines: ({ lines }: { lines: readonly string[] }): void => {
      spawnProxy.setAutoReplayLines({ lines });
    },
    setupDateNow: ({ timestamp }: { timestamp: number }): void => {
      jest.spyOn(Date, 'now').mockReturnValue(timestamp);
    },
  };
};
