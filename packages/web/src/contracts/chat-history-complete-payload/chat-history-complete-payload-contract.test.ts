import { chatHistoryCompletePayloadContract } from './chat-history-complete-payload-contract';
import { ChatHistoryCompletePayloadStub } from './chat-history-complete-payload.stub';

describe('chatHistoryCompletePayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {chatProcessId} => parses successfully', () => {
      const payload = ChatHistoryCompletePayloadStub();

      const result = chatHistoryCompletePayloadContract.parse(payload);

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
      });
    });

    it('VALID: {empty payload} => parses successfully (subscribe-quest finisher case)', () => {
      const result = chatHistoryCompletePayloadContract.parse({});

      expect(result).toStrictEqual({});
    });
  });
});
