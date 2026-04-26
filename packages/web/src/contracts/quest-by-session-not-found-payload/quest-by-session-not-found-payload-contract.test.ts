import { questBySessionNotFoundPayloadContract } from './quest-by-session-not-found-payload-contract';
import { QuestBySessionNotFoundPayloadStub } from './quest-by-session-not-found-payload.stub';

describe('questBySessionNotFoundPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {sessionId} => parses successfully', () => {
      const payload = QuestBySessionNotFoundPayloadStub();

      const result = questBySessionNotFoundPayloadContract.parse(payload);

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {missing sessionId} => throws validation error', () => {
      expect(() => {
        questBySessionNotFoundPayloadContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
