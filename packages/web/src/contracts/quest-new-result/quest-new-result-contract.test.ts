import { QuestNewResultStub } from './quest-new-result.stub';
import { questNewResultContract } from './quest-new-result-contract';

describe('questNewResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestNewResultStub();

      expect(questNewResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: wrong type} => throws', () => {
      expect(() => questNewResultContract.parse({ ...QuestNewResultStub(), questId: 123 })).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});
