import { SmoketestRunResultStub } from './smoketest-run-result.stub';
import { smoketestRunResultContract } from './smoketest-run-result-contract';

describe('smoketestRunResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = SmoketestRunResultStub();

      expect(smoketestRunResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {runId: wrong type} => throws', () => {
      expect(() =>
        smoketestRunResultContract.parse({ ...SmoketestRunResultStub(), runId: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
