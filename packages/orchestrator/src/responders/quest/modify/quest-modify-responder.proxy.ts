import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../../brokers/quest/load/quest-load-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { QuestModifyResponder } from './quest-modify-responder';

export const QuestModifyResponderProxy = (): {
  callResponder: typeof QuestModifyResponder;
  setupQuestModifyFound: ReturnType<typeof questModifyBrokerProxy>['setupQuestFound'];
  setupQuestModifyEmpty: ReturnType<typeof questModifyBrokerProxy>['setupEmptyFolder'];
  setupFindQuestPath: ReturnType<typeof questFindQuestPathBrokerProxy>['setupQuestFound'];
  setupLoadQuest: ReturnType<typeof questLoadBrokerProxy>['setupQuestFile'];
  setupPathJoin: ReturnType<typeof pathJoinAdapterProxy>['returns'];
  setupEventCapture: () => {
    getEmittedEvents: () => readonly { type: unknown; processId: unknown; payload: unknown }[];
  };
} => {
  const modifyProxy = questModifyBrokerProxy();
  const findProxy = questFindQuestPathBrokerProxy();
  const loadProxy = questLoadBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  eventsProxy.setupEmpty();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  return {
    callResponder: QuestModifyResponder,
    setupQuestModifyFound: modifyProxy.setupQuestFound,
    setupQuestModifyEmpty: modifyProxy.setupEmptyFolder,
    setupFindQuestPath: findProxy.setupQuestFound,
    setupLoadQuest: loadProxy.setupQuestFile,
    setupPathJoin: pathJoinProxy.returns,
    setupEventCapture: () => {
      const emittedEvents: { type: unknown; processId: unknown; payload: unknown }[] = [];

      orchestrationEventsState.on({
        type: 'quest-modified',
        handler: ({ processId, payload }) => {
          emittedEvents.push({ type: 'quest-modified', processId, payload });
        },
      });

      return {
        getEmittedEvents: (): readonly { type: unknown; processId: unknown; payload: unknown }[] =>
          emittedEvents,
      };
    },
  };
};
