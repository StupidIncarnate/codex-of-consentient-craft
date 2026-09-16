import { writeFailureTransformer } from './write-failure-transformer';

describe('writeFailureTransformer', () => {
  describe('a SystemError carrying a path', () => {
    it('VALID: {cause: an Error carrying path and code EACCES} => returns that path', () => {
      const cause = Object.assign(new Error('EACCES: permission denied'), {
        path: '/home/user/.dungeonmaster/guilds/foo/guild.json',
        code: 'EACCES',
      });

      const result = writeFailureTransformer({ cause });

      expect(result).toStrictEqual({ path: '/home/user/.dungeonmaster/guilds/foo/guild.json' });
    });
  });

  describe('a plain Error with no path', () => {
    it('VALID: {cause: a plain Error} => returns {path: null}', () => {
      const result = writeFailureTransformer({ cause: new Error('boom') });

      expect(result).toStrictEqual({ path: null });
    });
  });

  describe('no cause at all', () => {
    it('EMPTY: {} => returns {path: null}', () => {
      const result = writeFailureTransformer({});

      expect(result).toStrictEqual({ path: null });
    });
  });
});
