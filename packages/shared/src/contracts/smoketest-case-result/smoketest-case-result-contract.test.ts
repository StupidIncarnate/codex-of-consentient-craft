import { smoketestCaseResultContract } from './smoketest-case-result-contract';
import { SmoketestCaseResultStub } from './smoketest-case-result.stub';

describe('smoketestCaseResultContract', () => {
  it('VALID: {stub default} => returns passed case result', () => {
    const result = SmoketestCaseResultStub();

    expect({ passed: result.passed, caseId: result.caseId }).toStrictEqual({
      passed: true,
      caseId: 'mcp-list-quests',
    });
  });

  it('INVALID: {caseId: ""} => throws', () => {
    expect(() =>
      smoketestCaseResultContract.parse({
        caseId: '',
        name: 'x',
        passed: true,
      }),
    ).toThrow(/Too small: expected string to have >=1 characters/u);
  });
});
