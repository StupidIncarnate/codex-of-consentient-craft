import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { OrchestrationProcessStub } from '../../../contracts/orchestration-process/orchestration-process.stub';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';

export const PauseActiveHeadLayerResponderProxy = (): {
  setupWithProcessForQuest: (params: { questId: QuestId }) => void;
  setupNoProcess: () => void;
  getKilledProcessIds: () => readonly ProcessId[];
} => {
  const processesProxy = orchestrationProcessesStateProxy();
  processesProxy.setupEmpty();

  const killSpy = registerSpyOn({
    object: orchestrationProcessesState,
    method: 'kill',
    passthrough: true,
  });

  return {
    setupWithProcessForQuest: ({ questId }: { questId: QuestId }): void => {
      orchestrationProcessesState.register({
        orchestrationProcess: OrchestrationProcessStub({
          processId: ProcessIdStub({ value: 'proc-test-active' }),
          questId,
        }),
      });
    },
    setupNoProcess: (): void => {
      // intentionally empty — start state already empty
    },
    getKilledProcessIds: (): readonly ProcessId[] =>
      killSpy.mock.calls.map(([params]) => {
        const { processId } = params as Parameters<typeof orchestrationProcessesState.kill>[0];
        return processId;
      }),
  };
};
