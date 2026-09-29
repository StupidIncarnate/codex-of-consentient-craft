import { bufferLineCountContract } from './buffer-line-count-contract';
import { BufferLineCountStub } from './buffer-line-count.stub';

describe('bufferLineCountContract', () => {
  it('VALID: {value: 12} => parses and returns branded BufferLineCount', () => {
    const result = BufferLineCountStub({ value: 12 });

    expect(result).toBe(12);
  });

  it('EDGE: {value: 0} => parses the zero boundary', () => {
    const result = BufferLineCountStub({ value: 0 });

    expect(result).toBe(0);
  });

  it('INVALID: {value: -1} => throws for a negative length', () => {
    expect(() => bufferLineCountContract.parse(-1)).toThrow(/expected number to be >=0/u);
  });

  it('INVALID: {value: 1.5} => throws for a non-integer', () => {
    expect(() => bufferLineCountContract.parse(1.5)).toThrow(/expected int, received number/u);
  });
});
