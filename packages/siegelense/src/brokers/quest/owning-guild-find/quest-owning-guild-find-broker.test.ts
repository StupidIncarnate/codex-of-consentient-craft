import { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questOwningGuildFindBroker } from './quest-owning-guild-find-broker';
import { questOwningGuildFindBrokerProxy } from './quest-owning-guild-find-broker.proxy';

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
          [guildTwo.id]: [QuestStub({ id: 'f1429e0d-4205-4afb-9000-ef623ba32802' })],
        },
      });

      const result = await questOwningGuildFindBroker({
        questId: QuestIdStub({ value: 'f1429e0d-4205-4afb-9000-ef623ba32802' }),
      });

      expect(result).toBe('22222222-2222-4222-8222-222222222222');
      expect(proxy.getQuestListCalls()).toStrictEqual([
        { guildId: '11111111-1111-4111-8111-111111111111', quiet: true },
        { guildId: '22222222-2222-4222-8222-222222222222', quiet: true },
      ]);
    });
  });

  describe('a quest no registered guild owns', () => {
    it('ERROR: {questId not present in any guild} => throws naming the questId and how to recover', async () => {
      const proxy = questOwningGuildFindBrokerProxy();
      const guildOne = GuildListItemStub({ id: '11111111-1111-4111-8111-111111111111' });
      proxy.succeeds({ guilds: [guildOne], questsByGuildId: { [guildOne.id]: [] } });

      await expect(
        questOwningGuildFindBroker({ questId: QuestIdStub({ value: 'missing-quest' }) }),
      ).rejects.toThrow(
        /--quest missing-quest could not be resolved to a guild: no registered guild's quest list contains it\. Pass --guild explicitly, or check that DUNGEONMASTER_HOME points at the home this quest's guild is registered under\./u,
      );
    });
  });
});
