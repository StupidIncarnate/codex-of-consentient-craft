import { GuildRootNotFoundError } from './guild-root-not-found-error';

describe('GuildRootNotFoundError', () => {
  describe('constructor()', () => {
    it('VALID: {startPath: "/home/user/.dungeonmaster/guilds/foo/quests"} => creates error with descriptive message', () => {
      const error = new GuildRootNotFoundError({
        startPath: '/home/user/.dungeonmaster/guilds/foo/quests',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'GuildRootNotFoundError',
        message:
          'No guild.json found starting from /home/user/.dungeonmaster/guilds/foo/quests. Searched up the directory tree but no guild root was found.',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GuildRootNotFoundError);
    });

    it('EDGE: {startPath: "/"} => handles root path', () => {
      const error = new GuildRootNotFoundError({ startPath: '/' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'GuildRootNotFoundError',
        message:
          'No guild.json found starting from /. Searched up the directory tree but no guild root was found.',
      });
    });

    it('EDGE: {startPath: "/path with spaces/file.ts"} => handles paths with spaces', () => {
      const error = new GuildRootNotFoundError({ startPath: '/path with spaces/file.ts' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'GuildRootNotFoundError',
        message:
          'No guild.json found starting from /path with spaces/file.ts. Searched up the directory tree but no guild root was found.',
      });
    });
  });

  describe('inheritance', () => {
    it('VALID: error is instanceof Error and GuildRootNotFoundError', () => {
      const error = new GuildRootNotFoundError({ startPath: '/path/to/file.ts' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GuildRootNotFoundError);
    });
  });
});
