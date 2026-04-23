import { SmoketestCaseResultStub } from '@dungeonmaster/shared/contracts';

import { mergeSmoketestCaseResultTransformer } from './merge-smoketest-case-result-transformer';

describe('mergeSmoketestCaseResultTransformer', () => {
  it('VALID: {new caseId} => appends incoming to end', () => {
    const a = SmoketestCaseResultStub({ caseId: 'a', passed: true });
    const b = SmoketestCaseResultStub({ caseId: 'b', passed: false });

    const result = mergeSmoketestCaseResultTransformer({ existing: [a], incoming: b });

    expect(result).toStrictEqual([a, b]);
  });

  it('VALID: {existing caseId} => replaces entry in place', () => {
    const a = SmoketestCaseResultStub({ caseId: 'a', passed: false });
    const updated = SmoketestCaseResultStub({ caseId: 'a', passed: true });

    const result = mergeSmoketestCaseResultTransformer({ existing: [a], incoming: updated });

    expect(result).toStrictEqual([updated]);
  });

  it('EMPTY: {existing is empty} => returns single-item list', () => {
    const a = SmoketestCaseResultStub({ caseId: 'a', passed: true });

    const result = mergeSmoketestCaseResultTransformer({ existing: [], incoming: a });

    expect(result).toStrictEqual([a]);
  });
});
