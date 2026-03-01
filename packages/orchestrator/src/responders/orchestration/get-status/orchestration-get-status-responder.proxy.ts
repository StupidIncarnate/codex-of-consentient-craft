import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import type { OrchestrationProcessStub } from '../../../contracts/orchestration-process/orchestration-process.stub';
import { OrchestrationGetStatusResponder } from './orchestration-get-status-responder';

type OrchestrationProcess = ReturnType<typeof OrchestrationProcessStub>;

export const OrchestrationGetStatusResponderProxy = (): {
  callResponder: typeof OrchestrationGetStatusResponder;
  setupWithProcess: (params: { orchestrationProcess: OrchestrationProcess }) => void;
  setupEmpty: () => void;
} => {
  const stateProxy = orchestrationProcessesStateProxy();

  return {
    callResponder: OrchestrationGetStatusResponder,

    setupWithProcess: ({
      orchestrationProcess,
    }: {
      orchestrationProcess: OrchestrationProcess;
    }): void => {
      stateProxy.setupWithProcess({ orchestrationProcess });
    },

    setupEmpty: (): void => {
      stateProxy.setupEmpty();
    },
  };
};
