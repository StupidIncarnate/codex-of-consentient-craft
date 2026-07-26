import type { GuildId } from '@dungeonmaster/shared/contracts';
import { orchestratorAddQuestAdapterProxy } from '../../../adapters/orchestrator/add-quest/orchestrator-add-quest-adapter.proxy';
import { QuestUserAddResponder } from './quest-user-add-responder';

export const QuestUserAddResponderProxy = (): {
  setupAddQuest: (params: { guildId: GuildId }) => { expectedData: unknown };
  setupAddQuestError: (params: { guildId: GuildId; message: string }) => void;
  callResponder: typeof QuestUserAddResponder;
} => {
  const adapterProxy = orchestratorAddQuestAdapterProxy();

  return {
    setupAddQuest: ({ guildId }: { guildId: GuildId }): { expectedData: unknown } => {
      const result = {
        success: true as const,
        questId: 'test-quest',
        questFolder: '001-test-quest',
        filePath: '/path/to/quest.json',
      };
      adapterProxy.returns({ guildId, result: result as never });
      return { expectedData: result };
    },
    setupAddQuestError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      adapterProxy.throws({ guildId, error: new Error(message) });
    },
    callResponder: QuestUserAddResponder,
  };
};
