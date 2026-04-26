import { questModifiedPayloadContract } from './quest-modified-payload-contract';
import { QuestModifiedPayloadStub } from './quest-modified-payload.stub';

describe('questModifiedPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {questId, quest} => parses successfully', () => {
      const payload = QuestModifiedPayloadStub();

      const result = questModifiedPayloadContract.parse(payload);

      expect(result).toStrictEqual({
        questId: 'add-auth',
        quest: {},
      });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => {
        questModifiedPayloadContract.parse({ quest: {} });
      }).toThrow(/Required/u);
    });
  });
});
