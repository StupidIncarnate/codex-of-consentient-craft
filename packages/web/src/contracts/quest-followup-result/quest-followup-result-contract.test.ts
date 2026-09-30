import { QuestFollowupResultStub } from './quest-followup-result.stub';
import { questFollowupResultContract } from './quest-followup-result-contract';

describe('questFollowupResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestFollowupResultStub();

      expect(questFollowupResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {chatProcessId: wrong type} => throws', () => {
      expect(() =>
        questFollowupResultContract.parse({ ...QuestFollowupResultStub(), chatProcessId: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
