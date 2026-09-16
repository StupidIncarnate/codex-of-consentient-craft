import { megabytesContract } from './megabytes-contract';
import { MegabytesStub } from './megabytes.stub';

describe('megabytesContract', () => {
  it('VALID: {value: 1840} => parses and returns branded Megabytes', () => {
    const result = MegabytesStub({ value: 1840 });

    expect(result).toBe(1840);
  });

  it('INVALID: {value: -1} => throws for a negative quantity', () => {
    expect(() => megabytesContract.parse(-1)).toThrow(/Number must be greater than or equal to 0/u);
  });

  it('INVALID: {value: 1.5} => throws for a non-integer', () => {
    expect(() => megabytesContract.parse(1.5)).toThrow(/Expected integer, received float/u);
  });

  it('EDGE: {value: 0} => parses the zero boundary', () => {
    const result = MegabytesStub({ value: 0 });

    expect(result).toBe(0);
  });
});
