import { censusCountContract } from './census-count-contract';
import { CensusCountStub } from './census-count.stub';

describe('censusCountContract', () => {
  it('VALID: {value: 0} => parses zero', () => {
    const result = CensusCountStub({ value: 0 });

    expect(result).toBe(0);
  });

  it('VALID: {value: 41} => parses a positive whole number', () => {
    const result = CensusCountStub({ value: 41 });

    expect(result).toBe(41);
  });

  it('INVALID: {value: -1} => throws a too-small error', () => {
    expect(() => CensusCountStub({ value: -1 })).toThrow(/^[\s\S]*>=0[\s\S]*$/u);
  });

  it('INVALID: {value: 1.5} => throws an expected-int error', () => {
    expect(() => CensusCountStub({ value: 1.5 })).toThrow(/^[\s\S]*expected int[\s\S]*$/iu);
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = CensusCountStub();

    const result = censusCountContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
