import { QuestLoadResultStub } from './quest-load-result.stub';
import { questLoadResultContract } from './quest-load-result-contract';

describe('questLoadResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestLoadResultStub();

      expect(questLoadResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {flows: wrong type} => throws', () => {
      expect(() => questLoadResultContract.parse({ ...QuestLoadResultStub(), flows: 123 })).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});
