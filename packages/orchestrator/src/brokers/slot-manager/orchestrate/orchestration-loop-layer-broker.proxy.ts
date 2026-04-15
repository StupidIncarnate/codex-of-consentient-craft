import type { ExitCode } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { questModifyBroker } from '../../quest/modify/quest-modify-broker';
import { questModifyBrokerProxy } from '../../quest/modify/quest-modify-broker.proxy';
import { handleSignalLayerBrokerProxy } from './handle-signal-layer-broker.proxy';
import { spawnAgentLayerBrokerProxy } from './spawn-agent-layer-broker.proxy';

type QuestModifyCall = Parameters<typeof questModifyBroker>[0];

export const orchestrationLoopLayerBrokerProxy = (): {
  getWorkTracker: () => ReturnType<typeof WorkTrackerStub>;
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnAutoLines: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnceLazy: () => void;
  setupSpawnFailure: () => void;
  setupDateNow: (params: { timestamp: number }) => void;
  setupReplanTransitionReject: (params: { error: Error }) => void;
  getQuestModifyCalls: () => readonly QuestModifyCall[];
} => {
  const spawnProxy = spawnAgentLayerBrokerProxy();
  handleSignalLayerBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();

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
    setupReplanTransitionReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },
    getQuestModifyCalls: (): readonly QuestModifyCall[] => {
      const mocked = questModifyBroker as jest.MockedFunction<typeof questModifyBroker>;
      return mocked.mock.calls.map((call) => call[0]);
    },
  };
};
