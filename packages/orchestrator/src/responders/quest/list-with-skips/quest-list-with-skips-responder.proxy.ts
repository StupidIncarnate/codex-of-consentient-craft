import { questListBrokerProxy } from '../../../brokers/quest/list/quest-list-broker.proxy';
import { QuestListWithSkipsResponder } from './quest-list-with-skips-responder';

export const QuestListWithSkipsResponderProxy = (): {
  callResponder: typeof QuestListWithSkipsResponder;
  setupQuestsPath: ReturnType<typeof questListBrokerProxy>['setupQuestsPath'];
  setupQuestDirectories: ReturnType<typeof questListBrokerProxy>['setupQuestDirectories'];
  setupQuestFilePath: ReturnType<typeof questListBrokerProxy>['setupQuestFilePath'];
  setupQuestFile: ReturnType<typeof questListBrokerProxy>['setupQuestFile'];
} => {
  const brokerProxy = questListBrokerProxy();

  return {
    callResponder: QuestListWithSkipsResponder,
    setupQuestsPath: brokerProxy.setupQuestsPath,
    setupQuestDirectories: brokerProxy.setupQuestDirectories,
    setupQuestFilePath: brokerProxy.setupQuestFilePath,
    setupQuestFile: brokerProxy.setupQuestFile,
  };
};
