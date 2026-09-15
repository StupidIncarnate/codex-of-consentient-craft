import { instanceIdContract } from './instance-id-contract';
import { InstanceIdStub } from './instance-id.stub';

describe('instanceIdContract', () => {
  it('VALID: {value: "inst_7f3a9c21"} => parses and returns branded InstanceId', () => {
    const result = InstanceIdStub({ value: 'inst_7f3a9c21' });

    expect(result).toBe('inst_7f3a9c21');
  });

  it('INVALID: {value: "run_7f3a9c21"} => throws for the wrong prefix', () => {
    expect(() => instanceIdContract.parse('run_7f3a9c21')).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: "inst_7F3A"} => throws for uppercase hex', () => {
    expect(() => instanceIdContract.parse('inst_7F3A')).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: "inst_abc"} => throws for fewer than 4 hex characters', () => {
    expect(() => instanceIdContract.parse('inst_abc')).toThrow(/invalid_string/u);
  });

  it('EDGE: {value: "inst_abcd"} => parses at the 4-character hex minimum', () => {
    const result = InstanceIdStub({ value: 'inst_abcd' });

    expect(result).toBe('inst_abcd');
  });
});
