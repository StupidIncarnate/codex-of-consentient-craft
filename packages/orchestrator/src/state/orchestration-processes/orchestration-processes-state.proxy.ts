import { orchestrationProcessesState } from './orchestration-processes-state';
import type { OrchestrationProcessStub } from '../../contracts/orchestration-process/orchestration-process.stub';

type OrchestrationProcess = ReturnType<typeof OrchestrationProcessStub>;

export const orchestrationProcessesStateProxy = (): {
  setupWithProcess: (params: { orchestrationProcess: OrchestrationProcess }) => void;
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

  setupEmpty: (): void => {
    orchestrationProcessesState.clear();
  },
});
