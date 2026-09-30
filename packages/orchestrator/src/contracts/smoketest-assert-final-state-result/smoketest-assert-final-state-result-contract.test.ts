import { SmoketestAssertFinalStateResultStub } from './smoketest-assert-final-state-result.stub';
import { smoketestAssertFinalStateResultContract } from './smoketest-assert-final-state-result-contract';

describe('smoketestAssertFinalStateResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = SmoketestAssertFinalStateResultStub();

      expect(smoketestAssertFinalStateResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {passed: wrong type} => throws', () => {
      expect(() =>
        smoketestAssertFinalStateResultContract.parse({
          ...SmoketestAssertFinalStateResultStub(),
          passed: 'nope',
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
