import { QuestStartResultStub } from './quest-start-result.stub';
import { questStartResultContract } from './quest-start-result-contract';

describe('questStartResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestStartResultStub();

      expect(questStartResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {processId: wrong type} => throws', () => {
      expect(() =>
        questStartResultContract.parse({ ...QuestStartResultStub(), processId: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
