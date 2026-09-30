import { SmoketestRunTeardownChecksResultStub } from './smoketest-run-teardown-checks-result.stub';
import { smoketestRunTeardownChecksResultContract } from './smoketest-run-teardown-checks-result-contract';

describe('smoketestRunTeardownChecksResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = SmoketestRunTeardownChecksResultStub();

      expect(smoketestRunTeardownChecksResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {passed: wrong type} => throws', () => {
      expect(() =>
        smoketestRunTeardownChecksResultContract.parse({
          ...SmoketestRunTeardownChecksResultStub(),
          passed: 'nope',
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
