import type {
  ProcessIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from './orchestration-processes-state';
import type { OrchestrationProcessStub } from '../../contracts/orchestration-process/orchestration-process.stub';

type OrchestrationProcess = ReturnType<typeof OrchestrationProcessStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;
type QuestWorkItemId = ReturnType<typeof QuestWorkItemIdStub>;

export const orchestrationProcessesStateProxy = (): {
  setupWithProcess: (params: { orchestrationProcess: OrchestrationProcess }) => void;
  setupWithProcessAndKill: (params: {
    processId: ProcessId;
    questId: QuestId;
    // Registers the per-agent shape `findByQuestWorkItemId` answers for. Omit it for the
    // quest-level loop-dispatcher shape, which only `findByQuestId` finds.
    questWorkItemId?: QuestWorkItemId;
    kill: jest.Mock;
  }) => void;
  setupEmpty: () => void;
} => ({
  setupWithProcess: ({
    orchestrationProcess,
  }: {
    orchestrationProcess: OrchestrationProcess;
  }): void => {
    orchestrationProcessesState.clear();
    orchestrationProcessesState.register({ orchestrationProcess });
  },

  setupWithProcessAndKill: ({
    processId,
    questId,
    questWorkItemId,
    kill,
  }: {
    processId: ProcessId;
    questId: QuestId;
    questWorkItemId?: QuestWorkItemId;
    kill: jest.Mock;
  }): void => {
    orchestrationProcessesState.clear();
    orchestrationProcessesState.register({
      orchestrationProcess: {
        processId,
        questId,
        ...(questWorkItemId === undefined ? {} : { questWorkItemId }),
        kill,
      },
    });
  },

  setupEmpty: (): void => {
    orchestrationProcessesState.clear();
  },
});
