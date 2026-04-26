import { chatCompletePayloadContract } from './chat-complete-payload-contract';
import { ChatCompletePayloadStub } from './chat-complete-payload.stub';

describe('chatCompletePayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {chatProcessId only} => parses successfully', () => {
      const payload = ChatCompletePayloadStub();

      const result = chatCompletePayloadContract.parse(payload);

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
      });
    });

    it('VALID: {with sessionId} => parses successfully', () => {
      const payload = ChatCompletePayloadStub({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' as never,
      });

      const result = chatCompletePayloadContract.parse(payload);

      expect(result).toStrictEqual({
        chatProcessId: 'proc-12345',
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {missing chatProcessId} => throws validation error', () => {
      expect(() => {
        chatCompletePayloadContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
