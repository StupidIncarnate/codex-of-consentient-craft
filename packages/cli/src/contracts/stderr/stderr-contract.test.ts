import { stderrContract } from './stderr-contract';
import type { StderrStub } from './stderr.stub';

type Stderr = ReturnType<typeof StderrStub>;

describe('stderrContract', () => {
  describe('valid inputs', () => {
    it('VALID: {empty string} => returns branded Stderr', () => {
      const result: Stderr = stderrContract.parse('');

      expect(result).toBe('');
    });

    it('VALID: {error output} => returns branded Stderr', () => {
      const result: Stderr = stderrContract.parse('Error: Something went wrong');

      expect(result).toBe('Error: Something went wrong');
    });

    it('VALID: {multiline error} => returns branded Stderr', () => {
      const result: Stderr = stderrContract.parse('Error 1\nError 2\nError 3');

      expect(result).toBe('Error 1\nError 2\nError 3');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {null} => throws validation error', () => {
      expect(() => stderrContract.parse(null)).toThrow(/expected string/iu);
    });

    it('INVALID: {number} => throws validation error', () => {
      expect(() => stderrContract.parse(123 as never)).toThrow(/expected string/iu);
    });

    it('INVALID: {undefined} => throws validation error', () => {
      expect(() => stderrContract.parse(undefined)).toThrow(/required/iu);
    });
  });
});

describe('StderrStub', () => {
  it('VALID: {default} => returns empty string', () => {
    const { StderrStub: Stub } = require('./stderr.stub');
    const result = Stub();

    expect(result).toBe('');
  });

  it('VALID: {custom value} => returns custom value', () => {
    const { StderrStub: Stub } = require('./stderr.stub');
    const result = Stub({ value: 'Error message' });

    expect(result).toBe('Error message');
  });
});
