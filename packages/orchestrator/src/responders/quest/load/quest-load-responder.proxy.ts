import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../../brokers/quest/load/quest-load-broker.proxy';
import { QuestLoadResponder } from './quest-load-responder';

export const QuestLoadResponderProxy = (): {
  callResponder: typeof QuestLoadResponder;
  setupQuestFound: ReturnType<typeof questFindQuestPathBrokerProxy>['setupQuestFound'];
  setupQuestFile: ReturnType<typeof questLoadBrokerProxy>['setupQuestFile'];
  setupPathJoin: ReturnType<typeof pathJoinAdapterProxy>['returns'];
} => {
  const findProxy = questFindQuestPathBrokerProxy();
  const loadProxy = questLoadBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    callResponder: QuestLoadResponder,
    setupQuestFound: findProxy.setupQuestFound,
    setupQuestFile: loadProxy.setupQuestFile,
    setupPathJoin: pathJoinProxy.returns,
  };
};
