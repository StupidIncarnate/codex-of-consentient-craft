import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
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
  const cwdSetup = cwdProxy();

  return {
    callResponder: QuestMcpCreateResponder,
    // The responder reads the process cwd and hands it to the broker, so the staged cwd is the
    // broker's startDir.
    setupResolvedRepoRoot: ({ cwd, repoRoot }: { cwd: string; repoRoot: string }): void => {
      cwdSetup.setupCwd({ value: cwd });
      brokerProxy.setupResolvedRepoRoot({ cwd, repoRoot });
    },
    setupResolveFallback: ({ cwd }: { cwd: string }): void => {
      cwdSetup.setupCwd({ value: cwd });
      brokerProxy.setupResolveFallback({ cwd });
    },
    setupGuilds: brokerProxy.setupGuilds,
    setupAutoCreatedGuild: brokerProxy.setupAutoCreatedGuild,
    setupSuccessfulAdd: brokerProxy.setupSuccessfulAdd,
    setupAddFailure: brokerProxy.setupAddFailure,
    getGuildAddCalls: brokerProxy.getGuildAddCalls,
  };
};
