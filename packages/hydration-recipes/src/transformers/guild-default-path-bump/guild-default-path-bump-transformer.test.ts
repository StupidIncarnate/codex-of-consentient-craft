import { guildDefaultPathBumpTransformer } from './guild-default-path-bump-transformer';
import { GuildPathStub } from '@dungeonmaster/shared/contracts';

describe('guildDefaultPathBumpTransformer', () => {
  describe('a default fragment', () => {
    it('VALID: {path: "guilds-under-test/guild-1", by: 1} => returns "guilds-under-test/guild-2"', () => {
      const result = guildDefaultPathBumpTransformer({
        path: GuildPathStub({ value: 'guilds-under-test/guild-1' }),
        by: 1,
      });

      expect(result).toBe('guilds-under-test/guild-2');
    });

    it('VALID: {path: "guilds-under-test/guild-9", by: 3} => returns "guilds-under-test/guild-12"', () => {
      const result = guildDefaultPathBumpTransformer({
        path: GuildPathStub({ value: 'guilds-under-test/guild-9' }),
        by: 3,
      });

      expect(result).toBe('guilds-under-test/guild-12');
    });
  });

  describe('a path not matching the default shape', () => {
    it('VALID: {path: "/home/user/real-project", by: 1} => returns it unchanged', () => {
      const result = guildDefaultPathBumpTransformer({
        path: GuildPathStub({ value: '/home/user/real-project' }),
        by: 1,
      });

      expect(result).toBe('/home/user/real-project');
    });

    it('VALID: {path: "guilds-under-test/guild-1-extra", by: 1} => returns it unchanged', () => {
      const result = guildDefaultPathBumpTransformer({
        path: GuildPathStub({ value: 'guilds-under-test/guild-1-extra' }),
        by: 1,
      });

      expect(result).toBe('guilds-under-test/guild-1-extra');
    });
  });
});
