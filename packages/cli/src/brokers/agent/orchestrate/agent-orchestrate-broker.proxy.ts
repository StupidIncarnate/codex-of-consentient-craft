import type { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { ObservableStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { chaoswhispererSpawnBrokerProxy } from '../../chaoswhisperer/spawn/chaoswhisperer-spawn-broker.proxy';
import { pathseekerSpawnBrokerProxy } from '../../pathseeker/spawn/pathseeker-spawn-broker.proxy';
import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

type ExitCode = ReturnType<typeof ExitCodeStub>;
type Quest = ReturnType<typeof QuestStub>;

export const agentOrchestrateBrokerProxy = (): {
  setupChaoswhispererSuccess: (params: { exitCode: ExitCode }) => void;
  setupChaoswhispererSuccessWithNullExitCode: () => void;
  setupChaoswhispererError: (params: { error: Error }) => void;
  setupPathseekerSuccess: (params: { exitCode: ExitCode }) => void;
  setupPathseekerSuccessWithNullExitCode: () => void;
  setupPathseekerError: (params: { error: Error }) => void;
  setupSlotManagerSuccess: () => void;
  setupSlotManagerError: (params: { error: Error }) => void;
  slotManagerProxy: ReturnType<typeof slotManagerOrchestrateBrokerProxy>;
  createQuestReady: () => Quest;
  createQuestNotReady: () => Quest;
} => {
  const chaoswhispererProxy = chaoswhispererSpawnBrokerProxy();
  const pathseekerProxy = pathseekerSpawnBrokerProxy();
  const slotManagerProxy = slotManagerOrchestrateBrokerProxy();

  return {
    setupChaoswhispererSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      chaoswhispererProxy.setupSuccess({ exitCode });
    },

    setupChaoswhispererSuccessWithNullExitCode: (): void => {
      chaoswhispererProxy.setupSuccessWithNullExitCode();
    },

    setupChaoswhispererError: ({ error }: { error: Error }): void => {
      chaoswhispererProxy.setupError({ error });
    },

    setupPathseekerSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      pathseekerProxy.setupSuccess({ exitCode });
    },

    setupPathseekerSuccessWithNullExitCode: (): void => {
      pathseekerProxy.setupSuccessWithNullExitCode();
    },

    setupPathseekerError: ({ error }: { error: Error }): void => {
      pathseekerProxy.setupError({ error });
    },

    setupSlotManagerSuccess: (): void => {
      slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(
          QuestStub({
            steps: [],
          }),
        ),
      });
    },

    setupSlotManagerError: ({ error }: { error: Error }): void => {
      slotManagerProxy.runOrchestrationProxy.loopProxy.questLoadProxy.fsReadFileProxy.rejects({
        error,
      });
    },

    slotManagerProxy,

    createQuestReady: (): Quest => {
      const observableId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
      return QuestStub({
        observables: [ObservableStub({ id: observableId })],
      });
    },

    createQuestNotReady: (): Quest =>
      QuestStub({
        observables: [],
      }),
  };
};
