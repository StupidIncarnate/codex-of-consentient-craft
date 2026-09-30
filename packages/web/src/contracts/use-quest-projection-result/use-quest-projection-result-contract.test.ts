import { UseQuestProjectionResultStub } from './use-quest-projection-result.stub';
import { useQuestProjectionResultContract } from './use-quest-projection-result-contract';

describe('useQuestProjectionResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = UseQuestProjectionResultStub();

      expect(useQuestProjectionResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {data: wrong type} => throws', () => {
      expect(() =>
        useQuestProjectionResultContract.parse({ ...UseQuestProjectionResultStub(), data: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
