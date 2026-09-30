import { QuestIndexLoadResultStub } from './quest-index-load-result.stub';
import { questIndexLoadResultContract } from './quest-index-load-result-contract';

describe('questIndexLoadResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestIndexLoadResultStub();

      expect(questIndexLoadResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {userRequest: wrong type} => throws', () => {
      expect(() =>
        questIndexLoadResultContract.parse({ ...QuestIndexLoadResultStub(), userRequest: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
