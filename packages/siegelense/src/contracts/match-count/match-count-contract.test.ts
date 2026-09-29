import { matchCountContract } from './match-count-contract';
import { MatchCountStub } from './match-count.stub';

describe('matchCountContract', () => {
  it('VALID: {value: 2} => parses and returns branded MatchCount', () => {
    const result = MatchCountStub({ value: 2 });

    expect(result).toBe(2);
  });

  it('EDGE: {value: 0} => parses the zero boundary', () => {
    const result = MatchCountStub({ value: 0 });

    expect(result).toBe(0);
  });

  it('INVALID: {value: -1} => throws for a negative count', () => {
    expect(() => matchCountContract.parse(-1)).toThrow(/expected number to be >=0/u);
  });

  it('INVALID: {value: 1.5} => throws for a non-integer', () => {
    expect(() => matchCountContract.parse(1.5)).toThrow(/expected int, received number/u);
  });
});
