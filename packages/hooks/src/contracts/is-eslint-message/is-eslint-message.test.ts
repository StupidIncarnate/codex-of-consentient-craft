import { isEslintMessage } from './is-eslint-message';

describe('isEslintMessage', () => {
  describe('valid input', () => {
    it("VALID: {line: 5, message: 'error', severity: 2} => returns true", () => {
      const obj = { line: 5, message: 'error', severity: 2 };

      expect(isEslintMessage(obj)).toBe(true);
    });

    it("VALID: {line: 1, message: 'warn', severity: 1, ruleId: 'no-unused-vars'} => returns true", () => {
      const obj = { line: 1, message: 'warn', severity: 1, ruleId: 'no-unused-vars' };

      expect(isEslintMessage(obj)).toBe(true);
    });

    it("VALID: {line: 10, message: 'info', severity: 0, ruleId: undefined} => returns true", () => {
      const obj = { line: 10, message: 'info', severity: 0, ruleId: undefined };

      expect(isEslintMessage(obj)).toBe(true);
    });

    it("VALID: {line: -1, message: 'error', severity: 2} => returns true", () => {
      const obj = { line: -1, message: 'error', severity: 2 };

      expect(isEslintMessage(obj)).toBe(true);
    });
  });

  describe('invalid input', () => {
    it("INVALID: {line: 'five', message: 'error', severity: 2} => returns false", () => {
      const obj = { line: 'five', message: 'error', severity: 2 };

      expect(isEslintMessage(obj)).toBe(false);
    });

    it('INVALID: {line: 5, message: 123, severity: 2} => returns false', () => {
      const obj = { line: 5, message: 123, severity: 2 };

      expect(isEslintMessage(obj)).toBe(false);
    });

    it("INVALID: {line: 5, message: 'error', severity: 'high'} => returns false", () => {
      const obj = { line: 5, message: 'error', severity: 'high' };

      expect(isEslintMessage(obj)).toBe(false);
    });

    it("INVALID: {line: 5, message: 'error', severity: 2, ruleId: 123} => returns false", () => {
      const obj = { line: 5, message: 'error', severity: 2, ruleId: 123 };

      expect(isEslintMessage(obj)).toBe(false);
    });

    it("INVALID: 'string' => returns false", () => {
      const obj = 'string';

      expect(isEslintMessage(obj)).toBe(false);
    });

    it('INVALID: 123 => returns false', () => {
      const obj = 123;

      expect(isEslintMessage(obj)).toBe(false);
    });

    it('INVALID: {} => returns false', () => {
      const obj = {};

      expect(isEslintMessage(obj)).toBe(false);
    });

    it('INVALID: {line: 0} => returns false', () => {
      const obj = { line: 0 };

      expect(isEslintMessage(obj)).toBe(false);
    });

    it("INVALID: {message: 'error'} => returns false", () => {
      const obj = { message: 'error' };

      expect(isEslintMessage(obj)).toBe(false);
    });

    it('INVALID: {severity: 2} => returns false', () => {
      const obj = { severity: 2 };

      expect(isEslintMessage(obj)).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: null => returns false', () => {
      const obj = null;

      expect(isEslintMessage(obj)).toBe(false);
    });

    it('EMPTY: undefined => returns false', () => {
      const obj = undefined;

      expect(isEslintMessage(obj)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it("EDGE: {line: 999999, message: '', severity: 0} => returns true", () => {
      const obj = { line: 999999, message: '', severity: 0 };

      expect(isEslintMessage(obj)).toBe(true);
    });
  });
});
