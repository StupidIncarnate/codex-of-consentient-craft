import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { isTimeoutMessageGuard } from './is-timeout-message-guard';

describe('isTimeoutMessageGuard', () => {
  describe('a message naming a timeout', () => {
    it('VALID: {message: "page.goto: Timeout 30000ms exceeded."} => returns true', () => {
      const result = isTimeoutMessageGuard({
        message: ContentTextStub({ value: 'page.goto: Timeout 30000ms exceeded.' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {message mentions timeout lowercase} => returns true', () => {
      const result = isTimeoutMessageGuard({
        message: ContentTextStub({ value: 'visible [data-testid="X"] never resolved: timeout' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('a message naming an unrelated failure', () => {
    it('INVALID: {message: "AMBIGUOUS: 2 elements match [...]"} => returns false', () => {
      const result = isTimeoutMessageGuard({
        message: ContentTextStub({ value: 'AMBIGUOUS: 2 elements match [data-testid="X"]' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('no message at all', () => {
    it('EMPTY: {message: undefined} => returns false', () => {
      const result = isTimeoutMessageGuard({});

      expect(result).toBe(false);
    });
  });
});
