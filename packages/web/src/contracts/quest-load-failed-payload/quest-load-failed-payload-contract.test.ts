import { questLoadFailedPayloadContract } from './quest-load-failed-payload-contract';
import { QuestLoadFailedPayloadStub } from './quest-load-failed-payload.stub';

describe('questLoadFailedPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {questId, error} => parses successfully', () => {
      const payload = QuestLoadFailedPayloadStub();

      const result = questLoadFailedPayloadContract.parse(payload);

      expect(result).toStrictEqual({
        questId: 'add-auth',
        error:
          'Failed to parse quest file at /quests/q1/quest.json: comments.0.createdAt: Invalid datetime',
      });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => {
        questLoadFailedPayloadContract.parse({ error: 'boom' });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing error} => throws validation error', () => {
      expect(() => {
        questLoadFailedPayloadContract.parse({ questId: 'add-auth' });
      }).toThrow(/Required/u);
    });

    it('EMPTY: {error: ""} => throws validation error', () => {
      expect(() => {
        questLoadFailedPayloadContract.parse({ questId: 'add-auth', error: '' });
      }).toThrow(/at least 1/u);
    });
  });
});
