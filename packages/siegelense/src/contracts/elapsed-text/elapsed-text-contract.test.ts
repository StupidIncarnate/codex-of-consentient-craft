import { elapsedTextContract } from './elapsed-text-contract';
import { ElapsedTextStub } from './elapsed-text.stub';

describe('elapsedTextContract', () => {
  it('VALID: {value: "14m"} => parses successfully', () => {
    const result = ElapsedTextStub({ value: '14m' });

    expect(result).toBe('14m');
  });

  it('VALID: {value: "2s ago"} => a suffixed reading parses as one string', () => {
    const result = ElapsedTextStub({ value: '2s ago' });

    expect(result).toBe('2s ago');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      elapsedTextContract.parse('');
    }).toThrow(/String must contain at least 1 character/u);
  });

  it('EDGE: {value: "9h"} => a single-unit reading parses successfully', () => {
    const result = ElapsedTextStub({ value: '9h' });

    expect(result).toBe('9h');
  });
});
