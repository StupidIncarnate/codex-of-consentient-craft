import type { ExitCode } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { handleSignalLayerBrokerProxy } from './handle-signal-layer-broker.proxy';
import { spawnAgentLayerBrokerProxy } from './spawn-agent-layer-broker.proxy';

export const orchestrationLoopLayerBrokerProxy = (): {
  getWorkTracker: () => ReturnType<typeof WorkTrackerStub>;
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnAutoLines: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnceLazy: () => void;
  setupSpawnFailure: () => void;
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
    setupSpawnAutoLines: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      spawnProxy.setupSpawnAutoLines({ lines, exitCode });
    },
    setupSpawnOnceLazy: (): void => {
      spawnProxy.setupSpawnOnceLazy();
    },
    setupSpawnFailure: (): void => {
      spawnProxy.setupSpawnFailure();
    },
    setupDateNow: ({ timestamp }: { timestamp: number }): void => {
      registerSpyOn({ object: Date, method: 'now' }).mockReturnValue(timestamp);
    },
  };
};
