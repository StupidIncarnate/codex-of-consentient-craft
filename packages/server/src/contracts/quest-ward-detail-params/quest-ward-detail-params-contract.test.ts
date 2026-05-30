import { questWardDetailParamsContract } from './quest-ward-detail-params-contract';
import { QuestWardDetailParamsStub } from './quest-ward-detail-params.stub';

describe('questWardDetailParamsContract', () => {
  describe('valid input', () => {
    it('VALID: {questId, wardResultId both UUIDs} => parses both branded fields', () => {
      const result = QuestWardDetailParamsStub();

      expect({ questId: result.questId, wardResultId: result.wardResultId }).toStrictEqual({
        questId: '11111111-1111-4111-8111-111111111111',
        wardResultId: '22222222-2222-4222-8222-222222222222',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {wardResultId not a uuid} => throws', () => {
      expect(() =>
        questWardDetailParamsContract.parse({
          questId: '11111111-1111-4111-8111-111111111111',
          wardResultId: '../etc/passwd',
        }),
      ).toThrow(/uuid/iu);
    });

    it('INVALID: {missing wardResultId} => throws', () => {
      expect(() =>
        questWardDetailParamsContract.parse({
          questId: '11111111-1111-4111-8111-111111111111',
        }),
      ).toThrow(/Required/u);
    });
  });
});
