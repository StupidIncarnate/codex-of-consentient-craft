import { questMcpCreateBrokerProxy } from '../../../brokers/quest/mcp-create/quest-mcp-create-broker.proxy';
import { QuestMcpCreateResponder } from './quest-mcp-create-responder';

export const QuestMcpCreateResponderProxy = (): {
  callResponder: typeof QuestMcpCreateResponder;
  setupResolvedRepoRoot: ReturnType<typeof questMcpCreateBrokerProxy>['setupResolvedRepoRoot'];
  setupResolveFallback: ReturnType<typeof questMcpCreateBrokerProxy>['setupResolveFallback'];
  setupGuilds: ReturnType<typeof questMcpCreateBrokerProxy>['setupGuilds'];
  setupAutoCreatedGuild: ReturnType<typeof questMcpCreateBrokerProxy>['setupAutoCreatedGuild'];
  setupSuccessfulAdd: ReturnType<typeof questMcpCreateBrokerProxy>['setupSuccessfulAdd'];
  setupAddFailure: ReturnType<typeof questMcpCreateBrokerProxy>['setupAddFailure'];
  getGuildAddCalls: ReturnType<typeof questMcpCreateBrokerProxy>['getGuildAddCalls'];
} => {
  const brokerProxy = questMcpCreateBrokerProxy();

  return {
    callResponder: QuestMcpCreateResponder,
    setupResolvedRepoRoot: brokerProxy.setupResolvedRepoRoot,
    setupResolveFallback: brokerProxy.setupResolveFallback,
    setupGuilds: brokerProxy.setupGuilds,
    setupAutoCreatedGuild: brokerProxy.setupAutoCreatedGuild,
    setupSuccessfulAdd: brokerProxy.setupSuccessfulAdd,
    setupAddFailure: brokerProxy.setupAddFailure,
    getGuildAddCalls: brokerProxy.getGuildAddCalls,
  };
};
