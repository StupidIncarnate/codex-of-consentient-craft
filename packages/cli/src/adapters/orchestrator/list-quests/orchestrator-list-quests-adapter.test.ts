/**
 * PURPOSE: Tests for orchestratorListQuestsAdapter
 */
import { GuildIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsAdapter } from './orchestrator-list-quests-adapter';
import { orchestratorListQuestsAdapterProxy } from './orchestrator-list-quests-adapter.proxy';

describe('orchestratorListQuestsAdapter', () => {
  describe('successful listing', () => {
    it('VALID: {guildId} => returns quests from orchestrator', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const guildId = GuildIdStub();
      const quests = [
        QuestListItemStub({
          id: 'quest-1',
          title: 'First Quest',
          folder: '001-first-quest',
          status: 'pending',
        }),
      ];

      proxy.returns({ quests });

      const result = await orchestratorListQuestsAdapter({ guildId });

      expect(result).toStrictEqual(quests);
    });

    it('VALID: {guildId with no quests} => returns empty array', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const guildId = GuildIdStub();

      proxy.returns({ quests: [] });

      const result = await orchestratorListQuestsAdapter({ guildId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator error} => throws error', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const guildId = GuildIdStub();

      proxy.throws({ error: new Error('Failed to list quests') });

      await expect(orchestratorListQuestsAdapter({ guildId })).rejects.toThrow(
        /Failed to list quests/u,
      );
    });
  });
});
