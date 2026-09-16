import { questQueryRouteBroker } from './quest-query-route-broker';
import { questQueryRouteBrokerProxy } from './quest-query-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('questQueryRouteBroker', () => {
  describe('a where clause naming only the guildId', () => {
    it('VALID: {where: {guildId}} => returns every quest under that guild', async () => {
      const proxy = questQueryRouteBrokerProxy();
      const target = DmTargetStub({});
      const quests = [QuestStub({ title: 'Quest 1' }), QuestStub({ title: 'Quest 2' })];
      proxy.succeeds({ guildId: GUILD_ID, quests });

      const result = await questQueryRouteBroker({ target, where: { guildId: GUILD_ID } });

      expect(result.map((quest) => quest.title)).toStrictEqual(['Quest 1', 'Quest 2']);
    });
  });

  describe('a where clause narrowing by title', () => {
    it('VALID: {where: {guildId, title}} => returns only the matching quest', async () => {
      const proxy = questQueryRouteBrokerProxy();
      const target = DmTargetStub({});
      const quests = [QuestStub({ title: 'Quest 1' }), QuestStub({ title: 'Quest 2' })];
      proxy.succeeds({ guildId: GUILD_ID, quests });

      const result = await questQueryRouteBroker({
        target,
        where: { guildId: GUILD_ID, title: 'Quest 2' },
      });

      expect(result.map((quest) => quest.title)).toStrictEqual(['Quest 2']);
    });
  });
});
