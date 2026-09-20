import { hydrationRunResultContract } from './hydration-run-result-contract';
import { HydrationRunResultStub } from './hydration-run-result.stub';

describe('hydrationRunResultContract', () => {
  describe('a plan that saved two records', () => {
    it('VALID: {guild: aRecord, third: anotherRecord} => returns exactly those two keys', () => {
      const result = hydrationRunResultContract.parse(
        HydrationRunResultStub({ guild: { id: 'g1' }, third: { id: 'q3' } }),
      );

      expect(result).toStrictEqual({ guild: { id: 'g1' }, third: { id: 'q3' } });
    });
  });

  describe('a plan that saved nothing', () => {
    it('EMPTY: {} => returns an empty result', () => {
      const result = hydrationRunResultContract.parse(HydrationRunResultStub());

      expect(result).toStrictEqual({});
    });
  });
});
