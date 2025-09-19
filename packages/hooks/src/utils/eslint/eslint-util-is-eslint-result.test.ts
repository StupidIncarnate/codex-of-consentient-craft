import { eslintUtilIsEslintResult } from './eslint-util-is-eslint-result';

describe('eslintUtilIsEslintResult', () => {
  describe('valid input', () => {
    it("VALID: {messages: [], output: 'fixed code'} => returns true", () => {
      const obj = { messages: [], output: 'fixed code' };

      expect(eslintUtilIsEslintResult(obj)).toBe(true);
    });

    it("VALID: {messages: [{line: 1, message: 'error', severity: 2}]} => returns true", () => {
      const obj = { messages: [{ line: 1, message: 'error', severity: 2 }] };

      expect(eslintUtilIsEslintResult(obj)).toBe(true);
    });

    it('VALID: {messages: [], output: undefined} => returns true', () => {
      const obj = { messages: [], output: undefined };

      expect(eslintUtilIsEslintResult(obj)).toBe(true);
    });
  });

  describe('invalid input', () => {
    it("INVALID: {messages: 'not array'} => returns false", () => {
      const obj = { messages: 'not array' };

      expect(eslintUtilIsEslintResult(obj)).toBe(false);
    });

    it("INVALID: {messages: [{line: 'invalid'}]} => returns false", () => {
      const obj = { messages: [{ line: 'invalid' }] };

      expect(eslintUtilIsEslintResult(obj)).toBe(false);
    });

    it('INVALID: {messages: [], output: 123} => returns false', () => {
      const obj = { messages: [], output: 123 };

      expect(eslintUtilIsEslintResult(obj)).toBe(false);
    });

    it("INVALID: 'string' => returns false", () => {
      const obj = 'string';

      expect(eslintUtilIsEslintResult(obj)).toBe(false);
    });

    it('INVALID: {} => returns false', () => {
      const obj = {};

      expect(eslintUtilIsEslintResult(obj)).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: null => returns false', () => {
      const obj = null;

      expect(eslintUtilIsEslintResult(obj)).toBe(false);
    });

    it('EMPTY: undefined => returns false', () => {
      const obj = undefined;

      expect(eslintUtilIsEslintResult(obj)).toBe(false);
    });
  });
});
