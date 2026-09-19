import { guildQueryRouteBroker } from './guild-query-route-broker';
import { guildQueryRouteBrokerProxy } from './guild-query-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildListItemStub } from '@dungeonmaster/shared/contracts';

describe('guildQueryRouteBroker', () => {
  describe('an empty where clause', () => {
    it('VALID: {where: {}} => returns every registered guild', async () => {
      const proxy = guildQueryRouteBrokerProxy();
      const target = DmTargetStub({});
      const guilds = [
        GuildListItemStub({ name: 'Guild 1' }),
        GuildListItemStub({ name: 'Guild 2' }),
      ];
      proxy.succeeds({ guilds });

      const result = await guildQueryRouteBroker({ target, where: {} });

      expect(result.map((guild) => guild.name)).toStrictEqual(['Guild 1', 'Guild 2']);
    });
  });

  describe('a narrowing where clause', () => {
    it('VALID: {where: {name}} => returns only the matching guild', async () => {
      const proxy = guildQueryRouteBrokerProxy();
      const target = DmTargetStub({});
      const guilds = [
        GuildListItemStub({ name: 'Guild 1' }),
        GuildListItemStub({ name: 'Guild 2' }),
      ];
      proxy.succeeds({ guilds });

      const result = await guildQueryRouteBroker({ target, where: { name: 'Guild 2' } });

      expect(result.map((guild) => guild.name)).toStrictEqual(['Guild 2']);
    });
  });
});
