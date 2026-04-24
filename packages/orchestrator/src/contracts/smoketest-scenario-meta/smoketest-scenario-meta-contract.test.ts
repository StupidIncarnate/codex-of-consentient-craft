import { smoketestScenarioMetaContract } from './smoketest-scenario-meta-contract';
import { SmoketestScenarioMetaStub } from './smoketest-scenario-meta.stub';

describe('smoketestScenarioMetaContract', () => {
  it('VALID: {default stub} => parses', () => {
    expect(SmoketestScenarioMetaStub()).toStrictEqual({
      caseId: 'orch-happy-path',
      name: 'Orchestration: happy path',
      startedAt: 1_705_320_000_000,
    });
  });

  it('INVALID: {empty caseId} => throws', () => {
    expect(() => SmoketestScenarioMetaStub({ caseId: '' as never })).toThrow(/at least 1/u);
  });

  it('INVALID: {negative startedAt} => throws', () => {
    expect(() =>
      smoketestScenarioMetaContract.parse({
        caseId: 'x',
        name: 'n',
        startedAt: -1,
      }),
    ).toThrow(/greater than or equal/u);
  });
});
