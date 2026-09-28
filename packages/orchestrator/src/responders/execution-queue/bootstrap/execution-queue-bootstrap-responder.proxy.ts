import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';

import type { CapturedOrchestrationEmit } from '../../../contracts/captured-orchestration-emit/captured-orchestration-emit-contract';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';

// Bootstrap responder is idempotent and wires module-scoped state. The proxy
// composes child proxies per enforce-proxy-child-creation so tests that exercise
// wiring can reset all transitive state in one call.
export const ExecutionQueueBootstrapResponderProxy = (): {
  reset: () => void;
  // Real-bus scenario — see orchestrationEventsStateProxy.captureEmits. Subscribes a genuine
  // listener through the real bus, so a caller's own queue mutation (below) delivers into the
  // returned array through the responder's own wiring, not through a mock.
  captureBroadcasts: () => readonly CapturedOrchestrationEmit[];
  // The one real fact this responder's own listener cares about: SOMETHING changed in the queue.
  // A fresh stub entry is enough to trigger it — no field of the entry is read by the listener.
  triggerQueueChange: () => void;
} => {
  const eventsProxy = orchestrationEventsStateProxy();
  const queueProxy = questExecutionQueueStateProxy();

  return {
    reset: (): void => {
      eventsProxy.setupEmpty();
      queueProxy.setupEmpty();
    },
    captureBroadcasts: (): readonly CapturedOrchestrationEmit[] =>
      eventsProxy.captureEmits({ type: 'execution-queue-updated' }),
    triggerQueueChange: (): void => {
      questExecutionQueueState.enqueue({ entry: QuestQueueEntryStub() });
    },
  };
};
