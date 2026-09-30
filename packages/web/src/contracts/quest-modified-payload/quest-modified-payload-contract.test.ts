import { questModifiedPayloadContract } from './quest-modified-payload-contract';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { QuestModifiedPayloadStub } from './quest-modified-payload.stub';

describe('questModifiedPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {quest} => parses successfully', () => {
      const payload = QuestModifiedPayloadStub();

      const result = questModifiedPayloadContract.parse(payload);

      expect(result).toStrictEqual({
        quest: QuestStub(),
      });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {missing quest} => throws validation error', () => {
      expect(() => {
        questModifiedPayloadContract.parse({});
      }).toThrow(/received undefined/u);
    });
  });
});
