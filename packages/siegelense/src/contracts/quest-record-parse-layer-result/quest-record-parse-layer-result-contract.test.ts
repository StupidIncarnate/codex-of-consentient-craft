import { QuestRecordParseLayerResultStub } from './quest-record-parse-layer-result.stub';
import { questRecordParseLayerResultContract } from './quest-record-parse-layer-result-contract';

describe('questRecordParseLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestRecordParseLayerResultStub();

      expect(questRecordParseLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {quest: wrong type} => throws', () => {
      expect(() =>
        questRecordParseLayerResultContract.parse({
          ...QuestRecordParseLayerResultStub(),
          quest: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
