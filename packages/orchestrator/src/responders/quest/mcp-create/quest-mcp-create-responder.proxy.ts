import { questMcpCreateBrokerProxy } from '../../../brokers/quest/mcp-create/quest-mcp-create-broker.proxy';
import { QuestMcpCreateResponder } from './quest-mcp-create-responder';

export const QuestMcpCreateResponderProxy = (): {
  callResponder: typeof QuestMcpCreateResponder;
  setupMatchingGuild: ReturnType<typeof questMcpCreateBrokerProxy>['setupMatchingGuild'];
  setupGuildsWithMatch: ReturnType<typeof questMcpCreateBrokerProxy>['setupGuildsWithMatch'];
  setupNoMatchingGuild: ReturnType<typeof questMcpCreateBrokerProxy>['setupNoMatchingGuild'];
  setupEmptyGuildList: ReturnType<typeof questMcpCreateBrokerProxy>['setupEmptyGuildList'];
  setupAddFailure: ReturnType<typeof questMcpCreateBrokerProxy>['setupAddFailure'];
} => {
  const brokerProxy = questMcpCreateBrokerProxy();

  return {
    callResponder: QuestMcpCreateResponder,
    setupMatchingGuild: brokerProxy.setupMatchingGuild,
    setupGuildsWithMatch: brokerProxy.setupGuildsWithMatch,
    setupNoMatchingGuild: brokerProxy.setupNoMatchingGuild,
    setupEmptyGuildList: brokerProxy.setupEmptyGuildList,
    setupAddFailure: brokerProxy.setupAddFailure,
  };
};
