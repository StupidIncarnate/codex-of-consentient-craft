import type { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from './orchestration-processes-state';
import type { OrchestrationProcessStub } from '../../contracts/orchestration-process/orchestration-process.stub';

type OrchestrationProcess = ReturnType<typeof OrchestrationProcessStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;

export const orchestrationProcessesStateProxy = (): {
  setupWithProcess: (params: { orchestrationProcess: OrchestrationProcess }) => void;
  setupWithProcessAndKill: (params: {
    processId: ProcessId;
    questId: QuestId;
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
    kill,
  }: {
    processId: ProcessId;
    questId: QuestId;
    kill: jest.Mock;
  }): void => {
    orchestrationProcessesState.clear();
    orchestrationProcessesState.register({
      orchestrationProcess: { processId, questId, kill },
    });
  },

  setupEmpty: (): void => {
    orchestrationProcessesState.clear();
  },
});
