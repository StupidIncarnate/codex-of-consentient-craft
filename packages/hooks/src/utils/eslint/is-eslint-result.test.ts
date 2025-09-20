import { isEslintResult } from './is-eslint-result';

describe('isEslintResult', () => {
  describe('valid input', () => {
    it("VALID: {messages: [], output: 'fixed code'} => returns true", () => {
      const obj = { messages: [], output: 'fixed code' };

      expect(isEslintResult(obj)).toBe(true);
    });

    it("VALID: {messages: [{line: 1, message: 'error', severity: 2}]} => returns true", () => {
      const obj = { messages: [{ line: 1, message: 'error', severity: 2 }] };

      expect(isEslintResult(obj)).toBe(true);
    });

    it('VALID: {messages: [], output: undefined} => returns true', () => {
      const obj = { messages: [], output: undefined };

      expect(isEslintResult(obj)).toBe(true);
    });
  });

  describe('invalid input', () => {
    it("INVALID: {messages: 'not array'} => returns false", () => {
      const obj = { messages: 'not array' };

      expect(isEslintResult(obj)).toBe(false);
    });

    it("INVALID: {messages: [{line: 'invalid'}]} => returns false", () => {
      const obj = { messages: [{ line: 'invalid' }] };

      expect(isEslintResult(obj)).toBe(false);
    });

    it('INVALID: {messages: [], output: 123} => returns false', () => {
      const obj = { messages: [], output: 123 };

      expect(isEslintResult(obj)).toBe(false);
    });

    it("INVALID: 'string' => returns false", () => {
      const obj = 'string';

      expect(isEslintResult(obj)).toBe(false);
    });

    it('INVALID: {} => returns false', () => {
      const obj = {};

      expect(isEslintResult(obj)).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: null => returns false', () => {
      const obj = null;

      expect(isEslintResult(obj)).toBe(false);
    });

    it('EMPTY: undefined => returns false', () => {
      const obj = undefined;

      expect(isEslintResult(obj)).toBe(false);
    });
  });
});
