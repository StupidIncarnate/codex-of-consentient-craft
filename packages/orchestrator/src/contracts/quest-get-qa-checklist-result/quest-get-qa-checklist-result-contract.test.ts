import { QuestGetQaChecklistResultStub } from './quest-get-qa-checklist-result.stub';
import { questGetQaChecklistResultContract } from './quest-get-qa-checklist-result-contract';

describe('questGetQaChecklistResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestGetQaChecklistResultStub();

      expect(questGetQaChecklistResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {checklists: wrong type} => throws', () => {
      expect(() =>
        questGetQaChecklistResultContract.parse({
          ...QuestGetQaChecklistResultStub(),
          checklists: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
