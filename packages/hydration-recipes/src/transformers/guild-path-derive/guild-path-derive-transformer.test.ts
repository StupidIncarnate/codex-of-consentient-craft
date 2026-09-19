import { guildPathDeriveTransformer } from './guild-path-derive-transformer';
import { DmTargetStub } from '../../contracts/dm-target/dm-target.stub';
import { GuildPathStub } from '@dungeonmaster/shared/contracts';

describe('guildPathDeriveTransformer', () => {
  describe('a relative fragment', () => {
    it('VALID: {path: "guilds-under-test/guild-1"} => prefixes target.home', () => {
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      const result = guildPathDeriveTransformer({
        target,
        path: GuildPathStub({ value: 'guilds-under-test/guild-1' }),
      });

      expect(result).toBe('/tmp/dm-home/guilds-under-test/guild-1');
    });

    it('VALID: {two different indexes} => two different derived paths', () => {
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      const first = guildPathDeriveTransformer({
        target,
        path: GuildPathStub({ value: 'guilds-under-test/guild-1' }),
      });
      const second = guildPathDeriveTransformer({
        target,
        path: GuildPathStub({ value: 'guilds-under-test/guild-2' }),
      });

      expect([first, second]).toStrictEqual([
        '/tmp/dm-home/guilds-under-test/guild-1',
        '/tmp/dm-home/guilds-under-test/guild-2',
      ]);
    });
  });

  describe('an already-absolute override', () => {
    it('VALID: {path: "/real/project"} => returns it unchanged', () => {
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });

      const result = guildPathDeriveTransformer({
        target,
        path: GuildPathStub({ value: '/real/project' }),
      });

      expect(result).toBe('/real/project');
    });
  });
});
