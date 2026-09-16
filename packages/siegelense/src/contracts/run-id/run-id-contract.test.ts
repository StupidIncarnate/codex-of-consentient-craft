import { runIdContract } from './run-id-contract';
import { RunIdStub } from './run-id.stub';

describe('runIdContract', () => {
  it('VALID: {value: "run_42"} => parses and returns branded RunId', () => {
    const result = RunIdStub({ value: 'run_42' });

    expect(result).toBe('run_42');
  });

  it('INVALID: {value: "inst_1"} => throws for the wrong prefix', () => {
    expect(() => runIdContract.parse('inst_1')).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: "run_01"} => throws for a leading zero', () => {
    expect(() => runIdContract.parse('run_01')).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: "run_0"} => throws for zero', () => {
    expect(() => runIdContract.parse('run_0')).toThrow(/invalid_string/u);
  });

  it('EDGE: {value: "run_1"} => parses at the first-run boundary', () => {
    const result = RunIdStub({ value: 'run_1' });

    expect(result).toBe('run_1');
  });
});
