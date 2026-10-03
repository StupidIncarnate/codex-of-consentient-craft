import { NativeErrorStub } from '#gateway/node/util__types/is-native-error/native-error.stub';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { AddQuestResultStub } from '@dungeonmaster/shared/contracts/add-quest-result/add-quest-result.stub';
import type { Guild } from '@dungeonmaster/shared/contracts';
import { QuestUserAddResponder } from './quest-user-add-responder';

export const QuestUserAddResponderProxy = (): {
  setupAddQuest: (params: { guildId: Guild['id'] }) => { expectedData: unknown };
  setupAddQuestError: (params: { guildId: Guild['id']; message: string }) => void;
  callResponder: typeof QuestUserAddResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupAddQuest: ({ guildId }: { guildId: Guild['id'] }): { expectedData: unknown } => {
      const result = AddQuestResultStub();
      orchestrator.addQuestReturns({ guildId, result });
      return { expectedData: result };
    },
    setupAddQuestError: ({ guildId, message }: { guildId: Guild['id']; message: string }): void => {
      orchestrator.addQuestThrows({ guildId, error: NativeErrorStub({ message }) });
    },
    callResponder: QuestUserAddResponder,
  };
};
