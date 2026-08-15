import { questRiftcarverDetailParamsContract } from './quest-riftcarver-detail-params-contract';
import { QuestRiftcarverDetailParamsStub } from './quest-riftcarver-detail-params.stub';

describe('questRiftcarverDetailParamsContract', () => {
  describe('valid input', () => {
    it('VALID: {questId, riftcarverResultId both UUIDs} => parses both branded fields', () => {
      const result = QuestRiftcarverDetailParamsStub();

      expect({
        questId: result.questId,
        riftcarverResultId: result.riftcarverResultId,
      }).toStrictEqual({
        questId: '11111111-1111-4111-8111-111111111111',
        riftcarverResultId: '22222222-2222-4222-8222-222222222222',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {riftcarverResultId not a uuid} => throws', () => {
      expect(() =>
        questRiftcarverDetailParamsContract.parse({
          questId: '11111111-1111-4111-8111-111111111111',
          riftcarverResultId: '../etc/passwd',
        }),
      ).toThrow(/uuid/iu);
    });

    it('INVALID: {missing riftcarverResultId} => throws', () => {
      expect(() =>
        questRiftcarverDetailParamsContract.parse({
          questId: '11111111-1111-4111-8111-111111111111',
        }),
      ).toThrow(/Required/u);
    });
  });
});
