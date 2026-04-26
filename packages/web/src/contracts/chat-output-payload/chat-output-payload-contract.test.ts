import { chatOutputPayloadContract } from './chat-output-payload-contract';
import { ChatOutputPayloadStub } from './chat-output-payload.stub';

describe('chatOutputPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {chatProcessId, entries, sessionId} => parses successfully', () => {
      const payload = ChatOutputPayloadStub();

      const result = chatOutputPayloadContract.parse(payload);

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
        entries: [],
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      });
    });
  });

  describe('valid payloads — optional fields', () => {
    it('VALID: {missing chatProcessId} => parses successfully with chatProcessId undefined', () => {
      const result = chatOutputPayloadContract.parse({ entries: [] });

      expect(result.chatProcessId).toBe(undefined);
    });
  });
});
