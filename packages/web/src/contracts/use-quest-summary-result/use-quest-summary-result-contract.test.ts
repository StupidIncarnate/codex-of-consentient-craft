import { UseQuestSummaryResultStub } from './use-quest-summary-result.stub';
import { useQuestSummaryResultContract } from './use-quest-summary-result-contract';

describe('useQuestSummaryResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = UseQuestSummaryResultStub();

      expect(useQuestSummaryResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {data: wrong type} => throws', () => {
      expect(() =>
        useQuestSummaryResultContract.parse({ ...UseQuestSummaryResultStub(), data: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
