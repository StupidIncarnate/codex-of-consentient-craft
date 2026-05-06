import { takeCountContract } from './take-count-contract';
import { TakeCountStub } from './take-count.stub';

describe('takeCountContract', () => {
  it('VALID: {1} => parses', () => {
    expect(takeCountContract.parse(1)).toBe(TakeCountStub({ value: 1 }));
  });

  it('VALID: {3} => parses', () => {
    expect(takeCountContract.parse(3)).toBe(TakeCountStub({ value: 3 }));
  });

  it('INVALID: {0} => throws', () => {
    expect(() => takeCountContract.parse(0)).toThrow(/greater than 0/u);
  });

  it('INVALID: {-1} => throws', () => {
    expect(() => takeCountContract.parse(-1)).toThrow(/greater than 0/u);
  });

  it('INVALID: {1.5} => throws', () => {
    expect(() => takeCountContract.parse(1.5)).toThrow(/integer/u);
  });
});
