import { questRunWardBrokerProxy } from '../../../brokers/quest/run-ward/quest-run-ward-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { QuestRunWardResponder } from './quest-run-ward-responder';

export const QuestRunWardResponderProxy = (): {
  callResponder: typeof QuestRunWardResponder;
  setupQuest: ReturnType<typeof questRunWardBrokerProxy>['setupQuest'];
  wardExits: ReturnType<typeof questRunWardBrokerProxy>['wardExits'];
  wardExitsWithoutRunId: ReturnType<typeof questRunWardBrokerProxy>['wardExitsWithoutRunId'];
  captureWardChatEmits: () => {
    getProcessIds: () => readonly unknown[];
  };
} => {
  const brokerProxy = questRunWardBrokerProxy();
  // The responder streams ward's output onto this bus — ward has no sessionId, so this is its only
  // route to the UI. Captured here so a test can assert the lines are actually emitted.
  const eventsProxy = orchestrationEventsStateProxy();

  return {
    callResponder: QuestRunWardResponder,
    setupQuest: brokerProxy.setupQuest,
    wardExits: brokerProxy.wardExits,
    wardExitsWithoutRunId: brokerProxy.wardExitsWithoutRunId,
    // Capture chat-output emits and expose the process id each was routed to. Ward has no
    // sessionId, so the work-item id is the key the execution panel groups its rows by — if this
    // drifts, the lines render detached from the ward row (or not at all).
    captureWardChatEmits: (): { getProcessIds: () => readonly unknown[] } => {
      const captured = eventsProxy.captureEmits({ type: 'chat-output' });
      return {
        getProcessIds: (): readonly unknown[] => captured.map((emit) => String(emit.processId)),
      };
    },
  };
};
