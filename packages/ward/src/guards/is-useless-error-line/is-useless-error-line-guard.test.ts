import { isUselessErrorLineGuard } from './is-useless-error-line-guard';

describe('isUselessErrorLineGuard', () => {
  describe('useless lines', () => {
    it("VALID: {line: 'Error: thrown: \"'} => returns true", () => {
      const result = isUselessErrorLineGuard({ line: 'Error: thrown: "' });

      expect(result).toBe(true);
    });

    it("VALID: {line: 'thrown: \"'} => returns true", () => {
      const result = isUselessErrorLineGuard({ line: 'thrown: "' });

      expect(result).toBe(true);
    });

    it('VALID: {line: closing quote only} => returns true', () => {
      const result = isUselessErrorLineGuard({ line: '"' });

      expect(result).toBe(true);
    });

    it('VALID: {line: empty string} => returns true', () => {
      const result = isUselessErrorLineGuard({ line: '' });

      expect(result).toBe(true);
    });

    it('VALID: {line: whitespace only} => returns true', () => {
      const result = isUselessErrorLineGuard({ line: '   ' });

      expect(result).toBe(true);
    });

    it('VALID: {line: jest timeout suggestion} => returns true', () => {
      const result = isUselessErrorLineGuard({
        line: 'Add a timeout value to this test to increase the timeout, if this is a long-running test.',
      });

      expect(result).toBe(true);
    });

    it('VALID: {line: jest docs link} => returns true', () => {
      const result = isUselessErrorLineGuard({
        line: 'See https://jestjs.io/docs/api#testname-fn-timeout.',
      });

      expect(result).toBe(true);
    });

    it('EMPTY: {line: undefined} => returns true', () => {
      const result = isUselessErrorLineGuard({});

      expect(result).toBe(true);
    });
  });

  describe('meaningful lines', () => {
    it('VALID: {line: assertion error} => returns false', () => {
      const result = isUselessErrorLineGuard({ line: 'Expected true to be false' });

      expect(result).toBe(false);
    });

    it('VALID: {line: timeout annotation} => returns false', () => {
      const result = isUselessErrorLineGuard({
        line: 'TIMEOUT: Test killed before reaching any expect() calls.',
      });

      expect(result).toBe(false);
    });

    it('VALID: {line: zod error} => returns false', () => {
      const result = isUselessErrorLineGuard({
        line: 'ZodError: Expected string, received number',
      });

      expect(result).toBe(false);
    });

    it('VALID: {line: pollForStatus error} => returns false', () => {
      const result = isUselessErrorLineGuard({
        line: 'pollForStatus: quest reached terminal "blocked" but expected [complete].',
      });

      expect(result).toBe(false);
    });
  });
});
