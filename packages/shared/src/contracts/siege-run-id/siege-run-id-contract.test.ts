import { siegeRunIdContract } from './siege-run-id-contract';
import { SiegeRunIdStub } from './siege-run-id.stub';

describe('siegeRunIdContract', () => {
  it('VALID: {value: "run_2"} => parses and returns branded SiegeRunId', () => {
    const result = SiegeRunIdStub({ value: 'run_2' });

    expect(result).toBe('run_2');
  });

  it('EDGE: {value: "run_1"} => parses at the first-run boundary', () => {
    const result = SiegeRunIdStub({ value: 'run_1' });

    expect(result).toBe('run_1');
  });

  it('INVALID: {value: "inst_1"} => throws for the wrong prefix', () => {
    expect(() => siegeRunIdContract.parse('inst_1')).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: "run_01"} => throws for a leading zero', () => {
    expect(() => siegeRunIdContract.parse('run_01')).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: "run_0"} => throws for zero', () => {
    expect(() => siegeRunIdContract.parse('run_0')).toThrow(/invalid_string/u);
  });

  it('EMPTY: {value: ""} => throws', () => {
    expect(() => siegeRunIdContract.parse('')).toThrow(/invalid_string/u);
  });
});
