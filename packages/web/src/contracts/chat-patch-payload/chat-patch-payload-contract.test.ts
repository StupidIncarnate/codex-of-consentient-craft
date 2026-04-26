import { chatPatchPayloadContract } from './chat-patch-payload-contract';
import { ChatPatchPayloadStub } from './chat-patch-payload.stub';

describe('chatPatchPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {toolUseId, agentId} => parses successfully', () => {
      const payload = ChatPatchPayloadStub();

      const result = chatPatchPayloadContract.parse(payload);

      expect(result).toStrictEqual({
        toolUseId: 'tool-1',
        agentId: 'agent-1',
      });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {missing agentId} => throws validation error', () => {
      expect(() => {
        chatPatchPayloadContract.parse({ toolUseId: 'tool-1' });
      }).toThrow(/Required/u);
    });
  });
});
