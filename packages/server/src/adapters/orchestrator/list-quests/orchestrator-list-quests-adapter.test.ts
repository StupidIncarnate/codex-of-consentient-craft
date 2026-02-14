import { GuildIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsAdapter } from './orchestrator-list-quests-adapter';
import { orchestratorListQuestsAdapterProxy } from './orchestrator-list-quests-adapter.proxy';

describe('orchestratorListQuestsAdapter', () => {
  describe('successful list', () => {
    it('VALID: {guildId} => returns quest list items', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const guildId = GuildIdStub();
      const quests = [QuestListItemStub()];

      proxy.returns({ quests });

      const result = await orchestratorListQuestsAdapter({ guildId });

      expect(result).toStrictEqual(quests);
    });

    it('VALID: {guildId, no quests} => returns empty array', async () => {
      orchestratorListQuestsAdapterProxy();
      const guildId = GuildIdStub();

      const result = await orchestratorListQuestsAdapter({ guildId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const guildId = GuildIdStub();

      proxy.throws({ error: new Error('Failed to list quests') });

      await expect(orchestratorListQuestsAdapter({ guildId })).rejects.toThrow(
        /Failed to list quests/u,
      );
    });
  });
});
