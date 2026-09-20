import { siegeInstanceIdContract } from './siege-instance-id-contract';
import { SiegeInstanceIdStub } from './siege-instance-id.stub';

describe('siegeInstanceIdContract', () => {
  it('VALID: {value: "inst_7f3a9c21"} => parses and returns branded SiegeInstanceId', () => {
    const result = SiegeInstanceIdStub({ value: 'inst_7f3a9c21' });

    expect(result).toBe('inst_7f3a9c21');
  });

  it('EDGE: {value: "inst_abcd"} => parses at the 4-character hex minimum', () => {
    const result = SiegeInstanceIdStub({ value: 'inst_abcd' });

    expect(result).toBe('inst_abcd');
  });

  it('INVALID: {value: "run_7f3a9c21"} => throws for the wrong prefix', () => {
    expect(() => siegeInstanceIdContract.parse('run_7f3a9c21')).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: "inst_7F3A"} => throws for uppercase hex', () => {
    expect(() => siegeInstanceIdContract.parse('inst_7F3A')).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: "inst_abc"} => throws for fewer than 4 hex characters', () => {
    expect(() => siegeInstanceIdContract.parse('inst_abc')).toThrow(/invalid_string/u);
  });

  it('EMPTY: {value: ""} => throws', () => {
    expect(() => siegeInstanceIdContract.parse('')).toThrow(/invalid_string/u);
  });
});
