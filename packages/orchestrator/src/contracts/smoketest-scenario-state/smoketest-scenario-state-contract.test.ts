import { SmoketestScenarioStateStub } from './smoketest-scenario-state.stub';
import { smoketestScenarioStateContract } from './smoketest-scenario-state-contract';

describe('smoketestScenarioStateContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = SmoketestScenarioStateStub();

      expect(smoketestScenarioStateContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {instances: wrong type} => throws', () => {
      expect(() =>
        smoketestScenarioStateContract.parse({ ...SmoketestScenarioStateStub(), instances: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
