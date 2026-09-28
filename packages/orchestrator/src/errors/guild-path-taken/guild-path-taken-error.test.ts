import { GuildPathTakenError } from './guild-path-taken-error';

describe('GuildPathTakenError', () => {
  describe('constructor()', () => {
    it('VALID: {path} => sets name and path-suffixed message', () => {
      const error = new GuildPathTakenError({ path: '/home/user/my-app' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'GuildPathTakenError',
        message: 'A guild with path /home/user/my-app already exists',
      });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GuildPathTakenError);
    });

    it('EDGE: {path: ""} => message ends with the trailing "already exists" and no path', () => {
      const error = new GuildPathTakenError({ path: '' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'GuildPathTakenError',
        message: 'A guild with path  already exists',
      });
    });
  });
});
