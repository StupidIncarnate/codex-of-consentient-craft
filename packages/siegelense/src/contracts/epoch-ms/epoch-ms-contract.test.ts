import { epochMsContract } from './epoch-ms-contract';
import { EpochMsStub } from './epoch-ms.stub';

describe('epochMsContract', () => {
  it('VALID: {value: 1700000000000} => parses and returns branded EpochMs', () => {
    const result = EpochMsStub({ value: 1_700_000_000_000 });

    expect(result).toBe(1_700_000_000_000);
  });

  it('INVALID: {value: -1} => throws for a negative number', () => {
    expect(() => epochMsContract.parse(-1)).toThrow(/Number must be greater than or equal to 0/u);
  });

  it('INVALID: {value: 1.5} => throws for a non-integer', () => {
    expect(() => epochMsContract.parse(1.5)).toThrow(/Expected integer, received float/u);
  });

  it('EDGE: {value: 0} => parses the zero boundary', () => {
    const result = EpochMsStub({ value: 0 });

    expect(result).toBe(0);
  });
});
