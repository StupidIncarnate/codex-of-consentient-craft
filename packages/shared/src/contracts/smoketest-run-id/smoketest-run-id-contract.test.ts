import { smoketestRunIdContract } from './smoketest-run-id-contract';
import { SmoketestRunIdStub } from './smoketest-run-id.stub';

describe('smoketestRunIdContract', () => {
  it('VALID: {uuid} => parses as SmoketestRunId', () => {
    const id = SmoketestRunIdStub();

    expect(smoketestRunIdContract.parse(id)).toBe(id);
  });

  it('INVALID: {non-uuid} => throws', () => {
    expect(() => smoketestRunIdContract.parse('not-a-uuid')).toThrow(/uuid/u);
  });
});
