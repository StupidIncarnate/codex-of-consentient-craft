import { isFsError } from './is-fs-error';
import { FsErrorStub } from './fs-error.stub';

describe('isFsError', () => {
  describe('matching code', () => {
    it('VALID: {error: FsErrorStub({code: ENOENT}), code: ENOENT} => returns true', () => {
      const error = FsErrorStub({ code: 'ENOENT', path: '/tmp/missing.json' });

      expect(isFsError({ error, code: 'ENOENT' })).toBe(true);
    });

    it('VALID: {error: a prototype-less object with code ENOENT} => returns true', () => {
      const error = Object.assign(Object.create(null), { code: 'ENOENT' });

      expect(isFsError({ error, code: 'ENOENT' })).toBe(true);
    });
  });

  describe('mismatched code', () => {
    it('INVALID: {error: FsErrorStub({code: EACCES}), code: ENOENT} => returns false', () => {
      const error = FsErrorStub({ code: 'EACCES', path: '/tmp/locked.json' });

      expect(isFsError({ error, code: 'ENOENT' })).toBe(false);
    });
  });

  describe('non-object error values', () => {
    it('EMPTY: {error: null} => returns false', () => {
      expect(isFsError({ error: null, code: 'ENOENT' })).toBe(false);
    });

    it('EMPTY: {error: undefined} => returns false', () => {
      expect(isFsError({ error: undefined, code: 'ENOENT' })).toBe(false);
    });

    it('INVALID: {error: a string} => returns false', () => {
      expect(isFsError({ error: 'ENOENT', code: 'ENOENT' })).toBe(false);
    });

    it('INVALID: {error: an object with no code field} => returns false', () => {
      expect(isFsError({ error: { message: 'boom' }, code: 'ENOENT' })).toBe(false);
    });
  });
});
