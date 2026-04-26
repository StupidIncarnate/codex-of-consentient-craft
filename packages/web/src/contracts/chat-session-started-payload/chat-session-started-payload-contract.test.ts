import { chatSessionStartedPayloadContract } from './chat-session-started-payload-contract';
import { ChatSessionStartedPayloadStub } from './chat-session-started-payload.stub';

describe('chatSessionStartedPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {chatProcessId, sessionId} => parses successfully', () => {
      const payload = ChatSessionStartedPayloadStub();

      const result = chatSessionStartedPayloadContract.parse(payload);

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {missing sessionId} => throws validation error', () => {
      expect(() => {
        chatSessionStartedPayloadContract.parse({ chatProcessId: 'proc-1' });
      }).toThrow(/Required/u);
    });
  });
});
