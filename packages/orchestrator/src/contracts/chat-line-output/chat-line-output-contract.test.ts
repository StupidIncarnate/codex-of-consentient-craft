import { chatLineOutputContract } from './chat-line-output-contract';
import { ChatLineEntryStub, ChatLinePatchStub } from './chat-line-output.stub';

describe('chatLineOutputContract', () => {
  describe('entry variant', () => {
    it('VALID: {type: "entry", entry: record} => parses successfully', () => {
      const result = ChatLineEntryStub();

      expect(chatLineOutputContract.parse(result)).toStrictEqual({
        type: 'entry',
        entry: { type: 'assistant', message: { content: [] } },
      });
    });
  });

  describe('patch variant', () => {
    it('VALID: {type: "patch", toolUseId, agentId} => parses successfully', () => {
      const result = ChatLinePatchStub();

      expect(chatLineOutputContract.parse(result)).toStrictEqual({
        type: 'patch',
        toolUseId: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
        agentId: 'agent-abc',
      });
    });
  });

  describe('invalid output', () => {
    it('INVALID_TYPE: {type: "unknown"} => throws validation error', () => {
      expect(() => chatLineOutputContract.parse({ type: 'unknown' })).toThrow(
        /Invalid discriminator/u,
      );
    });
  });
});
