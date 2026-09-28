import { isStorageInaccessibleErrorGuard } from './is-storage-inaccessible-error-guard';

describe('isStorageInaccessibleErrorGuard', () => {
  describe('a fresh page with no origin', () => {
    it('VALID: {a SecurityError naming localStorage access denied} => returns true', () => {
      const error = new Error(
        "page.evaluate: SecurityError: Failed to read the 'localStorage' property from 'Window': " +
          'Access is denied for this document.',
      );

      const result = isStorageInaccessibleErrorGuard({ error });

      expect(result).toBe(true);
    });

    it('VALID: {a plain object carrying the message} => returns true, since the realm is not read', () => {
      const result = isStorageInaccessibleErrorGuard({
        error: { message: 'SecurityError: Access is denied for this document.' },
      });

      expect(result).toBe(true);
    });
  });

  describe('a real failure that is not a storage access error', () => {
    it('INVALID: {a Playwright TimeoutError} => returns false', () => {
      const error = new Error('Timeout 20000ms exceeded.');
      error.name = 'TimeoutError';

      const result = isStorageInaccessibleErrorGuard({ error });

      expect(result).toBe(false);
    });

    it('INVALID: {a SecurityError message without "Access is denied"} => returns false', () => {
      const error = new Error('SecurityError: something else entirely');

      const result = isStorageInaccessibleErrorGuard({ error });

      expect(result).toBe(false);
    });

    it('INVALID: {"Access is denied" without SecurityError} => returns false', () => {
      const error = new Error('PermissionError: Access is denied for this resource');

      const result = isStorageInaccessibleErrorGuard({ error });

      expect(result).toBe(false);
    });
  });

  describe('values that carry no message at all', () => {
    it('EMPTY: {error: undefined} => returns false', () => {
      const result = isStorageInaccessibleErrorGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {error: null} => returns false', () => {
      const result = isStorageInaccessibleErrorGuard({ error: null });

      expect(result).toBe(false);
    });

    it("EMPTY: {error: 'SecurityError' as a bare string} => returns false", () => {
      const result = isStorageInaccessibleErrorGuard({ error: 'SecurityError' });

      expect(result).toBe(false);
    });
  });
});
