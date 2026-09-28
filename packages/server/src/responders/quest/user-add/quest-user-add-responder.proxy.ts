import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { AddQuestResultStub } from '@dungeonmaster/shared/contracts';
import type { GuildId } from '@dungeonmaster/shared/contracts';
import { QuestUserAddResponder } from './quest-user-add-responder';

export const QuestUserAddResponderProxy = (): {
  setupAddQuest: (params: { guildId: GuildId }) => { expectedData: unknown };
  setupAddQuestError: (params: { guildId: GuildId; message: string }) => void;
  callResponder: typeof QuestUserAddResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupAddQuest: ({ guildId }: { guildId: GuildId }): { expectedData: unknown } => {
      const result = AddQuestResultStub();
      orchestrator.addQuestReturns({ guildId, result });
      return { expectedData: result };
    },
    setupAddQuestError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      orchestrator.addQuestThrows({ guildId, error: new Error(message) });
    },
    callResponder: QuestUserAddResponder,
  };
};
