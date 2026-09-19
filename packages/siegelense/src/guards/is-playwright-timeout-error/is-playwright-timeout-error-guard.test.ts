import { isPlaywrightTimeoutErrorGuard } from './is-playwright-timeout-error-guard';

describe('isPlaywrightTimeoutErrorGuard', () => {
  describe('a genuine ceiling', () => {
    it('VALID: {a rejection named TimeoutError} => returns true', () => {
      const error = new Error('Timeout 20000ms exceeded.');
      error.name = 'TimeoutError';

      const result = isPlaywrightTimeoutErrorGuard({ error });

      expect(result).toBe(true);
    });

    it('VALID: {a plain object carrying the name} => returns true, since the realm is not read', () => {
      const result = isPlaywrightTimeoutErrorGuard({
        error: { name: 'TimeoutError', message: 'Timeout 5000ms exceeded.' },
      });

      expect(result).toBe(true);
    });
  });

  describe('a real failure that is not a ceiling', () => {
    it('INVALID: {a strict-mode violation} => returns false, so the ambiguity is never reported as a timeout', () => {
      const error = new Error(
        'strict mode violation: locator(\'[data-testid="PIXEL_BTN"]\') resolved to 2 elements',
      );

      const result = isPlaywrightTimeoutErrorGuard({ error });

      expect(result).toBe(false);
    });

    it('INVALID: {a predicate whose source threw} => returns false', () => {
      const error = new Error('ReferenceError: quests is not defined');

      const result = isPlaywrightTimeoutErrorGuard({ error });

      expect(result).toBe(false);
    });
  });

  describe('values that carry no name at all', () => {
    it('EMPTY: {error: undefined} => returns false', () => {
      const result = isPlaywrightTimeoutErrorGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {error: null} => returns false', () => {
      const result = isPlaywrightTimeoutErrorGuard({ error: null });

      expect(result).toBe(false);
    });

    it("EMPTY: {error: 'TimeoutError' as a bare string} => returns false", () => {
      const result = isPlaywrightTimeoutErrorGuard({ error: 'TimeoutError' });

      expect(result).toBe(false);
    });
  });
});
