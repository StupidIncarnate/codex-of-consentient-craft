import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { questAddBrokerProxy } from '../../../brokers/quest/add/quest-add-broker.proxy';
import { QuestAddResponder } from './quest-add-responder';

export const QuestAddResponderProxy = (): {
  callResponder: typeof QuestAddResponder;
  setupQuestCreation: ReturnType<typeof questAddBrokerProxy>['setupQuestCreation'];
  setupQuestCreationFailure: ReturnType<typeof questAddBrokerProxy>['setupQuestCreationFailure'];
  setupEventCapture: () => {
    getEmittedEvents: () => readonly { type: unknown; processId: unknown; payload: unknown }[];
  };
} => {
  const brokerProxy = questAddBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  eventsProxy.setupEmpty();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  return {
    callResponder: QuestAddResponder,
    setupQuestCreation: brokerProxy.setupQuestCreation,
    setupQuestCreationFailure: brokerProxy.setupQuestCreationFailure,
    setupEventCapture: () => {
      const emittedEvents: { type: unknown; processId: unknown; payload: unknown }[] = [];

      orchestrationEventsState.on({
        type: 'quest-created',
        handler: ({ processId, payload }) => {
          emittedEvents.push({ type: 'quest-created', processId, payload });
        },
      });

      return {
        getEmittedEvents: (): readonly { type: unknown; processId: unknown; payload: unknown }[] =>
          emittedEvents,
      };
    },
  };
};
