import { QuestHumanVerdictRecordResultStub } from './quest-human-verdict-record-result.stub';
import { questHumanVerdictRecordResultContract } from './quest-human-verdict-record-result-contract';

describe('questHumanVerdictRecordResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestHumanVerdictRecordResultStub();

      expect(questHumanVerdictRecordResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {quest: wrong type} => throws', () => {
      expect(() =>
        questHumanVerdictRecordResultContract.parse({
          ...QuestHumanVerdictRecordResultStub(),
          quest: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
