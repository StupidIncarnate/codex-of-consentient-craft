import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { QuestModifyResponder } from './quest-modify-responder';

export const QuestModifyResponderProxy = (): {
  callResponder: typeof QuestModifyResponder;
  setupQuestModifyFound: ReturnType<typeof questModifyBrokerProxy>['setupQuestFound'];
  setupQuestModifyEmpty: ReturnType<typeof questModifyBrokerProxy>['setupEmptyFolder'];
} => {
  const modifyProxy = questModifyBrokerProxy();

  return {
    callResponder: QuestModifyResponder,
    setupQuestModifyFound: modifyProxy.setupQuestFound,
    setupQuestModifyEmpty: modifyProxy.setupEmptyFolder,
  };
};
