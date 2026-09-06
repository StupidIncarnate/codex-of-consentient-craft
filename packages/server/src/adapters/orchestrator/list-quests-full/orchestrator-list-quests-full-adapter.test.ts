import { GuildIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsFullAdapter } from './orchestrator-list-quests-full-adapter';
import { orchestratorListQuestsFullAdapterProxy } from './orchestrator-list-quests-full-adapter.proxy';

describe('orchestratorListQuestsFullAdapter', () => {
  describe('valid calls', () => {
    it('VALID: {guildId} => returns the guild quests whole', async () => {
      const proxy = orchestratorListQuestsFullAdapterProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
      const quest = QuestStub({ id: 'add-auth', folder: 'add-auth' });

      proxy.returns({ guildId, quests: [quest] });

      const result = await orchestratorListQuestsFullAdapter({ guildId });

      expect(result).toStrictEqual([quest]);
    });

    it('EMPTY: {guild with no quests} => returns an empty array', async () => {
      const proxy = orchestratorListQuestsFullAdapterProxy();
      const guildId = GuildIdStub({ value: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' });

      proxy.returns({ guildId, quests: [] });

      const result = await orchestratorListQuestsFullAdapter({ guildId });

      expect(result).toStrictEqual([]);
    });
  });

  describe('failures', () => {
    it('ERROR: {quests dir unreadable} => rejects with the underlying error', async () => {
      const proxy = orchestratorListQuestsFullAdapterProxy();
      const guildId = GuildIdStub({ value: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });

      proxy.throws({ guildId, error: new Error('ENOENT: no such file or directory') });

      await expect(orchestratorListQuestsFullAdapter({ guildId })).rejects.toThrow(
        /^ENOENT: no such file or directory$/u,
      );
    });
  });
});
