import { questListBrokerProxy } from '../../../brokers/quest/list/quest-list-broker.proxy';
import { QuestListResponder } from './quest-list-responder';

export const QuestListResponderProxy = (): {
  callResponder: typeof QuestListResponder;
  setupQuestsPath: ReturnType<typeof questListBrokerProxy>['setupQuestsPath'];
  setupQuestDirectories: ReturnType<typeof questListBrokerProxy>['setupQuestDirectories'];
  setupQuestFilePath: ReturnType<typeof questListBrokerProxy>['setupQuestFilePath'];
  setupQuestFile: ReturnType<typeof questListBrokerProxy>['setupQuestFile'];
} => {
  const brokerProxy = questListBrokerProxy();

  return {
    callResponder: QuestListResponder,
    setupQuestsPath: brokerProxy.setupQuestsPath,
    setupQuestDirectories: brokerProxy.setupQuestDirectories,
    setupQuestFilePath: brokerProxy.setupQuestFilePath,
    setupQuestFile: brokerProxy.setupQuestFile,
  };
};
