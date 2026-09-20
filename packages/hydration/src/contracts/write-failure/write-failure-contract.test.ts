import { writeFailureContract } from './write-failure-contract';
import { WriteFailureStub } from './write-failure.stub';

describe('writeFailureContract', () => {
  describe('a write that named a path', () => {
    it('VALID: {path: "/home/user/.dungeonmaster/guilds/foo/guild.json"} => returns that path', () => {
      const result = WriteFailureStub({
        path: '/home/user/.dungeonmaster/guilds/foo/guild.json',
      });

      expect(result).toStrictEqual({ path: '/home/user/.dungeonmaster/guilds/foo/guild.json' });
    });
  });

  describe('no path at all', () => {
    it('VALID: {path: null} => returns null', () => {
      const result = WriteFailureStub({ path: null });

      expect(result).toStrictEqual({ path: null });
    });
  });

  describe('a relative path', () => {
    it('INVALID: {path: "relative/guild.json"} => throws', () => {
      expect(() => writeFailureContract.parse({ path: 'relative/guild.json' })).toThrow(
        /Path must be absolute/u,
      );
    });
  });
});
