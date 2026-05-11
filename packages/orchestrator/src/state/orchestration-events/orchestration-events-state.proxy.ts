import type { OrchestrationEventType } from '@dungeonmaster/shared/contracts';

import type { CapturedOrchestrationEmit } from '../../contracts/captured-orchestration-emit/captured-orchestration-emit-contract';
import { orchestrationEventsState } from './orchestration-events-state';

export const orchestrationEventsStateProxy = (): {
  setupEmpty: () => void;
  captureEmits: (params: { type: OrchestrationEventType }) => readonly CapturedOrchestrationEmit[];
} => ({
  setupEmpty: (): void => {
    orchestrationEventsState.removeAllListeners();
  },
  captureEmits: ({
    type,
  }: {
    type: OrchestrationEventType;
  }): readonly CapturedOrchestrationEmit[] => {
    orchestrationEventsState.removeAllListeners();
    const captured: CapturedOrchestrationEmit[] = [];
    orchestrationEventsState.on({
      type,
      handler: ({ processId, payload }) => {
        captured.push({ processId, payload } as CapturedOrchestrationEmit);
      },
    });
    return captured;
  },
});
