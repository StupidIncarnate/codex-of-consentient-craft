import type { GuildStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { orchestratorGetGuildAdapterProxy } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter.proxy';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { designScaffoldBrokerProxy } from '../../../brokers/design/scaffold/design-scaffold-broker.proxy';
import { designStartBrokerProxy } from '../../../brokers/design/start/design-start-broker.proxy';
import { designProcessStateProxy } from '../../../state/design-process/design-process-state.proxy';
import { DesignStartResponder } from './design-start-responder';

type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

export const DesignStartResponderProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupGuild: (params: { guild: Guild }) => void;
  setupQuestError: (params: { error: Error }) => void;
  callResponder: typeof DesignStartResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const guildProxy = orchestratorGetGuildAdapterProxy();
  orchestratorModifyQuestAdapterProxy();
  designScaffoldBrokerProxy();
  designStartBrokerProxy();
  designProcessStateProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ result: { success: true, quest } as never });
    },
    setupGuild: ({ guild }: { guild: Guild }): void => {
      guildProxy.returns({ guild });
    },
    setupQuestError: ({ error }: { error: Error }): void => {
      questProxy.throws({ error });
    },
    callResponder: DesignStartResponder,
  };
};
