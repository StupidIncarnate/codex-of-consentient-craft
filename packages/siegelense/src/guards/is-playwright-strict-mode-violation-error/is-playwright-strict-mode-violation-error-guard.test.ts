import { isPlaywrightStrictModeViolationErrorGuard } from './is-playwright-strict-mode-violation-error-guard';

describe('isPlaywrightStrictModeViolationErrorGuard', () => {
  describe('a genuine strict-mode violation', () => {
    it('VALID: {a rejection whose message names strict mode violation} => returns true', () => {
      const error = new Error(
        'strict mode violation: locator(\'[data-testid="PIXEL_BTN"]\') resolved to 2 elements',
      );

      const result = isPlaywrightStrictModeViolationErrorGuard({ error });

      expect(result).toBe(true);
    });

    it('VALID: {a plain object carrying the message} => returns true, since the realm is not read', () => {
      const result = isPlaywrightStrictModeViolationErrorGuard({
        error: {
          message: "strict mode violation: locator('button') resolved to 3 elements",
        },
      });

      expect(result).toBe(true);
    });
  });

  describe('a real failure that is not a strict-mode violation', () => {
    it('INVALID: {a Playwright TimeoutError} => returns false, so a ceiling is never reported as ambiguous', () => {
      const error = new Error('Timeout 20000ms exceeded.');
      error.name = 'TimeoutError';

      const result = isPlaywrightStrictModeViolationErrorGuard({ error });

      expect(result).toBe(false);
    });

    it('INVALID: {a predicate whose source threw} => returns false', () => {
      const error = new Error('ReferenceError: quests is not defined');

      const result = isPlaywrightStrictModeViolationErrorGuard({ error });

      expect(result).toBe(false);
    });
  });

  describe('values that carry no message at all', () => {
    it('EMPTY: {error: undefined} => returns false', () => {
      const result = isPlaywrightStrictModeViolationErrorGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {error: null} => returns false', () => {
      const result = isPlaywrightStrictModeViolationErrorGuard({ error: null });

      expect(result).toBe(false);
    });

    it("EMPTY: {error: 'strict mode violation' as a bare string} => returns false", () => {
      const result = isPlaywrightStrictModeViolationErrorGuard({ error: 'strict mode violation' });

      expect(result).toBe(false);
    });
  });
});
