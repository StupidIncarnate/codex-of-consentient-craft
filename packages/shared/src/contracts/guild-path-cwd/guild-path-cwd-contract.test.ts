import { guildPathCwdContract } from './guild-path-cwd-contract';
import { GuildPathCwdStub as _GuildPathCwdStub } from './guild-path-cwd.stub';

describe('guildPathCwdContract', () => {
  describe('valid absolute paths', () => {
    it('VALID: {path: "/home/user/.dungeonmaster/guilds/my-guild"} => parses successfully', () => {
      const result = guildPathCwdContract.parse('/home/user/.dungeonmaster/guilds/my-guild');

      expect(result).toBe('/home/user/.dungeonmaster/guilds/my-guild');
    });

    it('VALID: {path: "C:\\\\dm\\\\guilds\\\\g1"} => parses successfully', () => {
      const result = guildPathCwdContract.parse('C:\\dm\\guilds\\g1');

      expect(result).toBe('C:\\dm\\guilds\\g1');
    });
  });

  describe('invalid relative paths', () => {
    it('INVALID: {path: "./guild"} => throws validation error', () => {
      expect(() => {
        return guildPathCwdContract.parse('./guild');
      }).toThrow('Path must be absolute');
    });

    it('INVALID: {path: "guilds/foo"} => throws validation error', () => {
      expect(() => {
        return guildPathCwdContract.parse('guilds/foo');
      }).toThrow('Path must be absolute');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {path: ""} => throws ZodError', () => {
      expect(() => {
        return guildPathCwdContract.parse('');
      }).toThrow('String must contain at least 1 character');
    });

    it('INVALID: {path: 123} => throws ZodError', () => {
      expect(() => {
        return guildPathCwdContract.parse(123);
      }).toThrow('Expected string');
    });

    it('INVALID: {path: null} => throws ZodError', () => {
      expect(() => {
        return guildPathCwdContract.parse(null);
      }).toThrow('Expected string');
    });
  });
});
