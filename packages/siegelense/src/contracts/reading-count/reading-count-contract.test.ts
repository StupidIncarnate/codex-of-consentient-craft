import { readingCountContract } from './reading-count-contract';
import { ReadingCountStub } from './reading-count.stub';

describe('readingCountContract', () => {
  it('VALID: {value: 3} => parses and returns branded ReadingCount', () => {
    const result = ReadingCountStub({ value: 3 });

    expect(result).toBe(3);
  });

  it('INVALID: {value: -1} => throws for a negative count', () => {
    expect(() => readingCountContract.parse(-1)).toThrow(
      /Number must be greater than or equal to 0/u,
    );
  });

  it('INVALID: {value: 1.5} => throws for a non-integer', () => {
    expect(() => readingCountContract.parse(1.5)).toThrow(/Expected integer, received float/u);
  });

  it('EDGE: {value: 0} => parses the zero boundary', () => {
    const result = ReadingCountStub({ value: 0 });

    expect(result).toBe(0);
  });
});
