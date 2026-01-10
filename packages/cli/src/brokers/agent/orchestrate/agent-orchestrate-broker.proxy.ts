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
    setupChaoswhispererSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      chaoswhispererProxy.setupSuccess({ exitCode });
    },

    setupChaoswhispererError: ({ error }: { error: Error }): void => {
      chaoswhispererProxy.setupError({ error });
    },

    setupPathseekerSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      pathseekerProxy.setupSuccess({ exitCode });
    },

    setupPathseekerError: ({ error }: { error: Error }): void => {
      pathseekerProxy.setupError({ error });
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
