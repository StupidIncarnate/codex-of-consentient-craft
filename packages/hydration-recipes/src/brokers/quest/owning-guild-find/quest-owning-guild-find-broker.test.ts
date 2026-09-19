import { questOwningGuildFindBroker } from './quest-owning-guild-find-broker';
import { questOwningGuildFindBrokerProxy } from './quest-owning-guild-find-broker.proxy';
import { GuildListItemStub, QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

describe('questOwningGuildFindBroker', () => {
  describe('a quest that exists under the second guild', () => {
    it('VALID: {questId} => returns the guild whose quest list contains it', async () => {
      const proxy = questOwningGuildFindBrokerProxy();
      const guildOne = GuildListItemStub({ id: '11111111-1111-4111-8111-111111111111' });
      const guildTwo = GuildListItemStub({ id: '22222222-2222-4222-8222-222222222222' });
      proxy.succeeds({
        guilds: [guildOne, guildTwo],
        questsByGuildId: {
          [guildOne.id]: [],
          [guildTwo.id]: [QuestStub({ id: 'add-auth' })],
        },
      });

      const result = await questOwningGuildFindBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toBe('22222222-2222-4222-8222-222222222222');
    });
  });

  describe('a quest no guild owns', () => {
    it('ERROR: {questId not present in any guild} => throws naming the questId', async () => {
      const proxy = questOwningGuildFindBrokerProxy();
      const guildOne = GuildListItemStub({ id: '11111111-1111-4111-8111-111111111111' });
      proxy.succeeds({ guilds: [guildOne], questsByGuildId: { [guildOne.id]: [] } });

      await expect(
        questOwningGuildFindBroker({ questId: QuestIdStub({ value: 'missing-quest' }) }),
      ).rejects.toThrow(/questOwningGuildFindBroker: no guild owns quest missing-quest/u);
    });
  });
});
