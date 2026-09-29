import { guildUniquePathResolveBroker } from './guild-unique-path-resolve-broker';
import { guildUniquePathResolveBrokerProxy } from './guild-unique-path-resolve-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildPathStub } from '@dungeonmaster/shared/contracts/guild-path/guild-path.stub';

describe('guildUniquePathResolveBroker', () => {
  describe('the default fragment, free', () => {
    it('VALID: {path: "guilds-under-test/guild-1", nothing on disk} => returns it unchanged', () => {
      const proxy = guildUniquePathResolveBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      proxy.setupFree({ absolutePaths: ['/tmp/dm-home/guilds-under-test/guild-1'] });

      const result = guildUniquePathResolveBroker({
        target,
        path: GuildPathStub({ value: 'guilds-under-test/guild-1' }),
      });

      expect(result).toBe('guilds-under-test/guild-1');
    });
  });

  describe('the default fragment, already occupied', () => {
    it('VALID: {path: "guilds-under-test/guild-1", guild-1 already on disk} => bumps to guild-2', () => {
      const proxy = guildUniquePathResolveBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      proxy.setupExisting({ absolutePaths: ['/tmp/dm-home/guilds-under-test/guild-1'] });
      proxy.setupFree({ absolutePaths: ['/tmp/dm-home/guilds-under-test/guild-2'] });

      const result = guildUniquePathResolveBroker({
        target,
        path: GuildPathStub({ value: 'guilds-under-test/guild-1' }),
      });

      expect(result).toBe('guilds-under-test/guild-2');
    });

    it('VALID: {guild-1 AND guild-2 already on disk} => bumps to guild-3', () => {
      const proxy = guildUniquePathResolveBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      proxy.setupExisting({
        absolutePaths: [
          '/tmp/dm-home/guilds-under-test/guild-1',
          '/tmp/dm-home/guilds-under-test/guild-2',
        ],
      });
      proxy.setupFree({ absolutePaths: ['/tmp/dm-home/guilds-under-test/guild-3'] });

      const result = guildUniquePathResolveBroker({
        target,
        path: GuildPathStub({ value: 'guilds-under-test/guild-1' }),
      });

      expect(result).toBe('guilds-under-test/guild-3');
    });
  });

  describe('an explicit path that does not match the default shape', () => {
    it('VALID: {path: "/home/user/real-project"} => returns it unchanged, whether or not it exists', () => {
      const proxy = guildUniquePathResolveBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      proxy.setupExisting({ absolutePaths: ['/home/user/real-project'] });

      const result = guildUniquePathResolveBroker({
        target,
        path: GuildPathStub({ value: '/home/user/real-project' }),
      });

      expect(result).toBe('/home/user/real-project');
    });
  });
});
