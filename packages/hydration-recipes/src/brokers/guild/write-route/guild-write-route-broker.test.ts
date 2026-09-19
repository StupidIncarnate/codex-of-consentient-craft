import { guildWriteRouteBroker } from './guild-write-route-broker';
import { guildWriteRouteBrokerProxy } from './guild-write-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildStub } from '@dungeonmaster/shared/contracts';

describe('guildWriteRouteBroker', () => {
  describe('a relative path in fields', () => {
    it('VALID: {name, relative path} => registers the guild at the derived absolute path', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
        urlSlug: 'guild-1',
      });
      proxy.succeeds({
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
        guild,
      });

      const result = await guildWriteRouteBroker({
        target,
        fields: { name: 'Guild 1', path: 'guilds-under-test/guild-1' },
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Guild 1',
        path: '/tmp/dm-home/guilds-under-test/guild-1',
        urlSlug: 'guild-1',
        createdAt: guild.createdAt,
      });
    });
  });

  describe('an already-absolute path in fields', () => {
    it('VALID: {name, absolute path} => registers the guild at that exact path', async () => {
      const proxy = guildWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const guild = GuildStub({
        id: '12345678-1234-1234-1234-123456789abc',
        name: 'Real Project',
        path: '/home/user/real-project',
        urlSlug: 'real-project',
      });
      proxy.succeeds({ name: 'Real Project', path: '/home/user/real-project', guild });

      const result = await guildWriteRouteBroker({
        target,
        fields: { name: 'Real Project', path: '/home/user/real-project' },
      });

      expect(result.path).toBe('/home/user/real-project');
    });
  });
});
