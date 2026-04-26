import { chatProcessIdParamsContract } from './chat-process-id-params-contract';
import { ChatProcessIdParamsStub } from './chat-process-id-params.stub';

describe('chatProcessIdParamsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {chatProcessId: "proc-12345"} => parses successfully', () => {
      const result = ChatProcessIdParamsStub({ chatProcessId: 'proc-12345' });

      expect(result.chatProcessId).toBe('proc-12345');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing chatProcessId} => throws validation error', () => {
      expect(() => {
        chatProcessIdParamsContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
