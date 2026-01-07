import type { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { ObservableStub, QuestStub, QuestTaskStub } from '@dungeonmaster/shared/contracts';

import { chaoswhispererSpawnBrokerProxy } from '../../chaoswhisperer/spawn/chaoswhisperer-spawn-broker.proxy';
import { pathseekerSpawnBrokerProxy } from '../../pathseeker/spawn/pathseeker-spawn-broker.proxy';

type ExitCode = ReturnType<typeof ExitCodeStub>;
type Quest = ReturnType<typeof QuestStub>;

export const agentOrchestrateBrokerProxy = (): {
  setupChaoswhispererSuccess: (params: { exitCode: ExitCode }) => void;
  setupChaoswhispererError: (params: { error: Error }) => void;
  setupPathseekerSuccess: (params: { exitCode: ExitCode }) => void;
  setupPathseekerError: (params: { error: Error }) => void;
  createQuestReady: () => Quest;
  createQuestNotReady: () => Quest;
} => {
  const chaoswhispererProxy = chaoswhispererSpawnBrokerProxy();
  const pathseekerProxy = pathseekerSpawnBrokerProxy();

  return {
    setupChaoswhispererSuccess: ({ exitCode }: { exitCode: ExitCode }) => {
      chaoswhispererProxy.setupSuccess({
        projectRoot: '/project' as never,
        exitCode,
      });
    },

    setupChaoswhispererError: ({ error }: { error: Error }) => {
      chaoswhispererProxy.setupError({
        projectRoot: '/project' as never,
        error,
      });
    },

    setupPathseekerSuccess: ({ exitCode }: { exitCode: ExitCode }) => {
      pathseekerProxy.setupSuccess({
        projectRoot: '/project' as never,
        exitCode,
      });
    },

    setupPathseekerError: ({ error }: { error: Error }) => {
      pathseekerProxy.setupError({
        projectRoot: '/project' as never,
        error,
      });
    },

    createQuestReady: (): Quest => {
      const observableId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
      return QuestStub({
        observables: [ObservableStub({ id: observableId })],
        tasks: [QuestTaskStub({ observableIds: [observableId] })],
      });
    },

    createQuestNotReady: (): Quest =>
      QuestStub({
        observables: [],
        tasks: [],
      }),
  };
};
