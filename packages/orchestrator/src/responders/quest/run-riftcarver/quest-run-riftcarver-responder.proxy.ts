import type { CapturedOrchestrationEmit } from '../../../contracts/captured-orchestration-emit/captured-orchestration-emit-contract';
import { questRunRiftcarverBrokerProxy } from '../../../brokers/quest/run-riftcarver/quest-run-riftcarver-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { QuestRunRiftcarverResponder } from './quest-run-riftcarver-responder';

export const QuestRunRiftcarverResponderProxy = (): {
  callResponder: typeof QuestRunRiftcarverResponder;
  setupQuest: ReturnType<typeof questRunRiftcarverBrokerProxy>['setupQuest'];
  captureCarveChatEmits: () => {
    getProcessIds: () => readonly unknown[];
    // The ChatEntry objects that actually reached the bus, flattened across every emit. A carve is
    // invisible without a sessionId, so the CONTENT arriving here — not the presence of a callback
    // — is the only evidence the stream is wired.
    getEntries: () => readonly unknown[];
  };
} => {
  const brokerProxy = questRunRiftcarverBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();

  return {
    callResponder: QuestRunRiftcarverResponder,
    setupQuest: brokerProxy.setupQuest,
    captureCarveChatEmits: (): {
      getProcessIds: () => readonly unknown[];
      getEntries: () => readonly unknown[];
    } => {
      const captured = eventsProxy.captureEmits({ type: 'chat-output' });
      const entriesOf = (emit: CapturedOrchestrationEmit): readonly unknown[] => {
        const { entries } = emit.payload;
        return Array.isArray(entries) ? entries : [];
      };
      return {
        getProcessIds: (): readonly unknown[] => captured.map((emit) => String(emit.processId)),
        getEntries: (): readonly unknown[] => captured.flatMap((emit) => entriesOf(emit)),
      };
    },
  };
};
