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
  });

  describe('invalid payloads', () => {
    it('INVALID: {missing chatProcessId} => throws validation error', () => {
      expect(() => {
        chatHistoryCompletePayloadContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
