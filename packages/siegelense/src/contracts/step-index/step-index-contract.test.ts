import { stepIndexContract } from './step-index-contract';
import { StepIndexStub } from './step-index.stub';

describe('stepIndexContract', () => {
  it('VALID: {value: 3} => parses and returns branded StepIndex', () => {
    const result = StepIndexStub({ value: 3 });

    expect(result).toBe(3);
  });

  it('INVALID: {value: 0} => throws for zero, below the first-step minimum', () => {
    expect(() => stepIndexContract.parse(0)).toThrow(/Number must be greater than or equal to 1/u);
  });

  it('INVALID: {value: -1} => throws for a negative number', () => {
    expect(() => stepIndexContract.parse(-1)).toThrow(/Number must be greater than or equal to 1/u);
  });

  it('INVALID: {value: 1.5} => throws for a non-integer', () => {
    expect(() => stepIndexContract.parse(1.5)).toThrow(/Expected integer, received float/u);
  });

  it('EDGE: {value: 1} => parses at the first-step boundary', () => {
    const result = StepIndexStub({ value: 1 });

    expect(result).toBe(1);
  });
});
