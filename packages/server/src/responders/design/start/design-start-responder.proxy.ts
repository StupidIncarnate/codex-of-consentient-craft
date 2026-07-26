import type { GuildStub, QuestId, QuestStub } from '@dungeonmaster/shared/contracts';
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
  setupQuestError: (params: { questId: QuestId; error: Error }) => void;
  callResponder: typeof DesignStartResponder;
} => {
  const questProxy = orchestratorGetQuestAdapterProxy();
  const guildProxy = orchestratorGetGuildAdapterProxy();
  const modifyQuestProxy = orchestratorModifyQuestAdapterProxy();
  // DesignStartResponder fires the modifyQuest call after scaffolding but discards its result,
  // and this proxy's constructor runs before the test picks a questId — there's no address to
  // key on here, so this is a genuine wildcard (see orchestrator-modify-quest-adapter.proxy.ts).
  modifyQuestProxy.returns({ result: { success: true } as never });
  designScaffoldBrokerProxy();
  designStartBrokerProxy();
  designProcessStateProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      questProxy.returns({ questId: quest.id, result: { success: true, quest } as never });
    },
    setupGuild: ({ guild }: { guild: Guild }): void => {
      guildProxy.returns({ guild });
    },
    setupQuestError: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      questProxy.throws({ questId, error });
    },
    callResponder: DesignStartResponder,
  };
};
