import { isWalkedFile } from './is-walked-file';

describe('isWalkedFile', () => {
  describe('matching shape', () => {
    it('VALID: {path, sizeBytes, modifiedAtMs all present and correctly typed} => returns true', () => {
      const value = { path: '/repo/a.jsonl', sizeBytes: 12, modifiedAtMs: 0 };

      expect(isWalkedFile(value)).toBe(true);
    });

    it('VALID: {value has extra unrelated fields} => returns true', () => {
      const value = { path: '/repo/a.jsonl', sizeBytes: 12, modifiedAtMs: 0, extra: 'ignored' };

      expect(isWalkedFile(value)).toBe(true);
    });
  });

  describe('missing fields', () => {
    it('INVALID: {value missing path} => returns false', () => {
      const value = { sizeBytes: 12, modifiedAtMs: 0 };

      expect(isWalkedFile(value)).toBe(false);
    });

    it('INVALID: {value missing sizeBytes} => returns false', () => {
      const value = { path: '/repo/a.jsonl', modifiedAtMs: 0 };

      expect(isWalkedFile(value)).toBe(false);
    });

    it('INVALID: {value missing modifiedAtMs} => returns false', () => {
      const value = { path: '/repo/a.jsonl', sizeBytes: 12 };

      expect(isWalkedFile(value)).toBe(false);
    });
  });

  describe('wrong-typed fields', () => {
    it('INVALID: {path is a number} => returns false', () => {
      const value = { path: 12, sizeBytes: 12, modifiedAtMs: 0 };

      expect(isWalkedFile(value)).toBe(false);
    });

    it('INVALID: {sizeBytes is a string} => returns false', () => {
      const value = { path: '/repo/a.jsonl', sizeBytes: '12', modifiedAtMs: 0 };

      expect(isWalkedFile(value)).toBe(false);
    });

    it('INVALID: {modifiedAtMs is a string} => returns false', () => {
      const value = { path: '/repo/a.jsonl', sizeBytes: 12, modifiedAtMs: '0' };

      expect(isWalkedFile(value)).toBe(false);
    });
  });

  describe('non-object values', () => {
    it('EMPTY: {value: null} => returns false', () => {
      expect(isWalkedFile(null)).toBe(false);
    });

    it('EMPTY: {value: undefined} => returns false', () => {
      expect(isWalkedFile(undefined)).toBe(false);
    });

    it('INVALID: {value: a string} => returns false', () => {
      expect(isWalkedFile('/repo/a.jsonl')).toBe(false);
    });
  });
});
