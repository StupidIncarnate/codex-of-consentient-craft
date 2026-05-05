import { chatLineOutputContract } from './chat-line-output-contract';
import { ChatLineAgentDetectedStub, ChatLineEntriesStub } from './chat-line-output.stub';

describe('chatLineOutputContract', () => {
  describe('entries variant', () => {
    it('VALID: {type: "entries", entries: ChatEntry[]} => parses successfully', () => {
      const result = ChatLineEntriesStub();

      expect(chatLineOutputContract.parse(result)).toStrictEqual({
        type: 'entries',
        entries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'hello',
            uuid: 'chat-line-entries-stub-uuid',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      });
    });
  });

  describe('agent-detected variant', () => {
    it('VALID: {type: "agent-detected", toolUseId, agentId} => parses successfully', () => {
      const result = ChatLineAgentDetectedStub();

      expect(chatLineOutputContract.parse(result)).toStrictEqual({
        type: 'agent-detected',
        toolUseId: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
        agentId: 'agent-abc',
      });
    });
  });

  describe('invalid output', () => {
    it('INVALID: {type: "unknown"} => throws validation error', () => {
      expect(() => chatLineOutputContract.parse({ type: 'unknown' })).toThrow(
        /Invalid discriminator/u,
      );
    });

    it('INVALID: {type: "entries" without entries field} => throws validation error', () => {
      expect(() => chatLineOutputContract.parse({ type: 'entries' })).toThrow(/Required/u);
    });

    it('INVALID: {type: "agent-detected" without toolUseId} => throws validation error', () => {
      expect(() =>
        chatLineOutputContract.parse({ type: 'agent-detected', agentId: 'agent-abc' }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {type: "agent-detected" without agentId} => throws validation error', () => {
      expect(() =>
        chatLineOutputContract.parse({
          type: 'agent-detected',
          toolUseId: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
        }),
      ).toThrow(/Required/u);
    });
  });
});
