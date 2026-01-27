import { stdoutContract } from './stdout-contract';
import type { StdoutStub } from './stdout.stub';

type Stdout = ReturnType<typeof StdoutStub>;

describe('stdoutContract', () => {
  describe('valid inputs', () => {
    it('VALID: {empty string} => returns branded Stdout', () => {
      const result: Stdout = stdoutContract.parse('');

      expect(result).toBe('');
    });

    it('VALID: {command output} => returns branded Stdout', () => {
      const result: Stdout = stdoutContract.parse('Hello World');

      expect(result).toBe('Hello World');
    });

    it('VALID: {multiline output} => returns branded Stdout', () => {
      const result: Stdout = stdoutContract.parse('Line 1\nLine 2\nLine 3');

      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {null} => throws validation error', () => {
      expect(() => stdoutContract.parse(null)).toThrow(/expected string/iu);
    });

    it('INVALID: {number} => throws validation error', () => {
      expect(() => stdoutContract.parse(123 as never)).toThrow(/expected string/iu);
    });

    it('INVALID: {undefined} => throws validation error', () => {
      expect(() => stdoutContract.parse(undefined)).toThrow(/required/iu);
    });
  });
});

describe('StdoutStub', () => {
  it('VALID: {default} => returns empty string', () => {
    const { StdoutStub: Stub } = require('./stdout.stub');
    const result = Stub();

    expect(result).toBe('');
  });

  it('VALID: {custom value} => returns custom value', () => {
    const { StdoutStub: Stub } = require('./stdout.stub');
    const result = Stub({ value: 'Output message' });

    expect(result).toBe('Output message');
  });
});
