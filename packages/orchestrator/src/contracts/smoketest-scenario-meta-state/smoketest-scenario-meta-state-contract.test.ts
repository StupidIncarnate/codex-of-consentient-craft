import { SmoketestScenarioMetaStateStub } from './smoketest-scenario-meta-state.stub';
import { smoketestScenarioMetaStateContract } from './smoketest-scenario-meta-state-contract';

describe('smoketestScenarioMetaStateContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = SmoketestScenarioMetaStateStub();

      expect(smoketestScenarioMetaStateContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {entries: wrong type} => throws', () => {
      expect(() =>
        smoketestScenarioMetaStateContract.parse({
          ...SmoketestScenarioMetaStateStub(),
          entries: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
