import { chatSessionContract } from './chat-session-contract';
import { ChatSessionStub } from './chat-session.stub';

describe('chatSessionContract', () => {
  describe('valid chat sessions', () => {
    it('VALID: minimal chat session => parses successfully', () => {
      const chatSession = ChatSessionStub();

      const result = chatSessionContract.parse(chatSession);

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        agentRole: 'PathSeeker',
        startedAt: '2024-01-15T10:00:00.000Z',
        active: false,
      });
    });

    it('VALID: active session => parses successfully', () => {
      const chatSession = ChatSessionStub({ active: true });

      const result = chatSessionContract.parse(chatSession);

      expect(result.active).toBe(true);
    });

    it('VALID: ended session => parses successfully', () => {
      const chatSession = ChatSessionStub({
        endedAt: '2024-01-15T12:00:00.000Z',
      });

      const result = chatSessionContract.parse(chatSession);

      expect(result.endedAt).toBe('2024-01-15T12:00:00.000Z');
    });

    it('VALID: custom agent role => parses successfully', () => {
      const chatSession = ChatSessionStub({ agentRole: 'GateKeeper' });

      const result = chatSessionContract.parse(chatSession);

      expect(result.agentRole).toBe('GateKeeper');
    });

    it('VALID: without active field => defaults to false', () => {
      const result = chatSessionContract.parse({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        agentRole: 'PathSeeker',
        startedAt: '2024-01-15T10:00:00.000Z',
      });

      expect(result.active).toBe(false);
    });
  });

  describe('invalid chat sessions', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        chatSessionContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: empty sessionId => throws validation error', () => {
      const baseChatSession = ChatSessionStub();

      expect(() => {
        chatSessionContract.parse({
          ...baseChatSession,
          sessionId: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: invalid startedAt => throws validation error', () => {
      const baseChatSession = ChatSessionStub();

      expect(() => {
        chatSessionContract.parse({
          ...baseChatSession,
          startedAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: invalid endedAt => throws validation error', () => {
      const baseChatSession = ChatSessionStub();

      expect(() => {
        chatSessionContract.parse({
          ...baseChatSession,
          endedAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });
  });
});
