import { isNodeErrorWithCodeGuard } from './is-node-error-with-code-guard';

describe('isNodeErrorWithCodeGuard', () => {
  describe('valid inputs', () => {
    it('VALID: {error with matching code} => returns true', () => {
      const result = isNodeErrorWithCodeGuard({
        error: Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
        code: 'ENOENT',
      });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {error with a different code} => returns false', () => {
      const result = isNodeErrorWithCodeGuard({
        error: Object.assign(new Error('EACCES'), { code: 'EACCES' }),
        code: 'ENOENT',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {error with no code property} => returns false', () => {
      const result = isNodeErrorWithCodeGuard({ error: new Error('plain'), code: 'ENOENT' });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {error: null} => returns false', () => {
      const result = isNodeErrorWithCodeGuard({ error: null, code: 'ENOENT' });

      expect(result).toBe(false);
    });

    it('EMPTY: {no error} => returns false', () => {
      const result = isNodeErrorWithCodeGuard({ code: 'ENOENT' });

      expect(result).toBe(false);
    });
  });
});
