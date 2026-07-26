/**
 * PURPOSE: Proxy for orchestrator-list-quests-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorListQuestsAdapterProxy();
 * proxy.returns({ guildId: GuildIdStub(), quests: [QuestListItemStub()] });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type GuildId = ReturnType<typeof GuildIdStub>;

export const orchestratorListQuestsAdapterProxy = (): {
  returns: (params: { guildId: GuildId; quests: QuestListItem[] }) => void;
  throws: (params: { guildId: GuildId; error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.listQuests });

  return {
    returns: ({ guildId, quests }: { guildId: GuildId; quests: QuestListItem[] }): void => {
      handle.calledWith([{ guildId }]).resolves(quests);
    },
    throws: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      handle.calledWith([{ guildId }]).rejects(error);
    },
  };
};
