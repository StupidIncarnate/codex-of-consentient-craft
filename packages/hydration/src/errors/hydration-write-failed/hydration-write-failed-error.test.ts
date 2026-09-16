import { HydrationWriteFailedError } from './hydration-write-failed-error';

describe('HydrationWriteFailedError', () => {
  describe('constructor()', () => {
    it('VALID: {path, cause: EACCES} => names the ingredient, the path and the underlying OS failure', () => {
      const error = new HydrationWriteFailedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        path: '/home/user/.dungeonmaster/guilds/foo/guild.json',
        cause: new Error('EACCES: permission denied'),
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationWriteFailedError',
        message:
          'recipe "guild-mid-execution": ingredient "guild"\'s write route failed writing "/home/user/.dungeonmaster/guilds/foo/guild.json": Error: EACCES: permission denied',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationWriteFailedError => returns true', () => {
      const error = new HydrationWriteFailedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        path: '/home/user/.dungeonmaster/guilds/foo/guild.json',
        cause: new Error('EACCES'),
      });

      expect(error instanceof HydrationWriteFailedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationWriteFailedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        path: '/home/user/.dungeonmaster/guilds/foo/guild.json',
        cause: new Error('EACCES'),
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
