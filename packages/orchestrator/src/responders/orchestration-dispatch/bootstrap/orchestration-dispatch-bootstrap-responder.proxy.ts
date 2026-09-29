import { questNodeDispatchLoopBrokerProxy } from '../../../brokers/quest/node-dispatch-loop/quest-node-dispatch-loop-broker.proxy';
import { questNodeDispatchRunnerBrokerProxy } from '../../../brokers/quest/node-dispatch-runner/quest-node-dispatch-runner-broker.proxy';
import { orchestrationDispatchState } from '../../../state/orchestration-dispatch/orchestration-dispatch-state';
import { orchestrationDispatchStateProxy } from '../../../state/orchestration-dispatch/orchestration-dispatch-state.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';

type CapturedOrchestrationEmit = ReturnType<
  ReturnType<typeof orchestrationEventsStateProxy>['captureEmits']
>[number];

export const OrchestrationDispatchBootstrapResponderProxy = (): {
  reset: () => void;
  // Real-bus scenario — see orchestrationEventsStateProxy.captureEmits.
  captureDispatchStateChangedEmits: () => readonly CapturedOrchestrationEmit[];
  // The one real fact this responder's own onChange listener cares about: play/pause flipped.
  triggerPlayChange: (params: { isPlaying: boolean }) => void;
} => {
  questNodeDispatchLoopBrokerProxy();
  questNodeDispatchRunnerBrokerProxy();
  const dispatchStateProxy = orchestrationDispatchStateProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  const processesProxy = orchestrationProcessesStateProxy();
  const queueProxy = questExecutionQueueStateProxy();

  return {
    reset: (): void => {
      dispatchStateProxy.setupEmpty();
      eventsProxy.setupEmpty();
      processesProxy.setupEmpty();
      queueProxy.setupEmpty();
    },
    captureDispatchStateChangedEmits: (): readonly CapturedOrchestrationEmit[] =>
      eventsProxy.captureEmits({ type: 'dispatch-state-changed' }),
    triggerPlayChange: ({ isPlaying }: { isPlaying: boolean }): void => {
      orchestrationDispatchState.setPlaying({ isPlaying });
    },
  };
};
