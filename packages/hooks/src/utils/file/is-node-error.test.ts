import { isNodeError } from './is-node-error';

describe('isNodeError', () => {
  describe('valid input', () => {
    it('VALID: Error with code property => returns true', () => {
      const error = new Error('Test error');
      Object.assign(error, { code: 'ENOENT' });

      const result = isNodeError(error);

      expect(result).toBe(true);
    });

    it('VALID: Error with code EACCES => returns true', () => {
      const error = new Error('Permission denied');
      Object.assign(error, { code: 'EACCES' });

      const result = isNodeError(error);

      expect(result).toBe(true);
    });

    it('VALID: Error with errno property => returns true', () => {
      const error = new Error('System error');
      Object.assign(error, { code: 'EISDIR', errno: -21 });

      const result = isNodeError(error);

      expect(result).toBe(true);
    });
  });

  describe('invalid input', () => {
    it('INVALID: Error without code property => returns false', () => {
      const error = new Error('Regular error');

      const result = isNodeError(error);

      expect(result).toBe(false);
    });

    it('INVALID: non-Error object with code => returns false', () => {
      const notError = { code: 'ENOENT', message: 'fake error' };

      const result = isNodeError(notError);

      expect(result).toBe(false);
    });

    it('INVALID: string error => returns false', () => {
      const error = 'string error';

      const result = isNodeError(error);

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: null => returns false', () => {
      const result = isNodeError(null);

      expect(result).toBe(false);
    });

    it('EDGE: undefined => returns false', () => {
      const result = isNodeError(undefined);

      expect(result).toBe(false);
    });

    it('EDGE: Error with null code => returns true', () => {
      const error = new Error('Error with null code');
      Object.assign(error, { code: null });

      const result = isNodeError(error);

      expect(result).toBe(true);
    });

    it('EDGE: Error with undefined code => returns true', () => {
      const error = new Error('Error with undefined code');
      Object.assign(error, { code: undefined });

      const result = isNodeError(error);

      expect(result).toBe(true);
    });
  });
});
