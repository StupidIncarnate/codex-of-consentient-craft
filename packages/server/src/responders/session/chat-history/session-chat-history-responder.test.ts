import { GuildStub, GuildIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';
import { SessionChatHistoryResponderProxy } from './session-chat-history-responder.proxy';

describe('SessionChatHistoryResponder', () => {
  describe('successful retrieval', () => {
    it('VALID: {valid sessionId and guildId} => returns 200 with entries', async () => {
      const proxy = SessionChatHistoryResponderProxy();
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub();
      const guild = GuildStub({ id: guildId, path: '/test/project' as never });

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/testuser' });
      proxy.setupMainEntries({
        content:
          '{"type":"user","message":"hello","timestamp":"2025-01-01T00:00:00.000Z"}\n{"type":"assistant","message":"hi","timestamp":"2025-01-01T00:00:01.000Z"}',
      });
      proxy.setupSubagentDirMissing();

      const result = await proxy.callResponder({
        params: { sessionId },
        query: { guildId },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: [
          {
            type: 'user',
            message: 'hello',
            timestamp: '2025-01-01T00:00:00.000Z',
            source: 'session',
          },
          {
            type: 'assistant',
            message: 'hi',
            timestamp: '2025-01-01T00:00:01.000Z',
            source: 'session',
          },
        ],
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', async () => {
      const proxy = SessionChatHistoryResponderProxy();

      const result = await proxy.callResponder({
        params: null,
        query: { guildId: GuildIdStub() },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing sessionId} => returns 400 with error', async () => {
      const proxy = SessionChatHistoryResponderProxy();

      const result = await proxy.callResponder({
        params: {},
        query: { guildId: GuildIdStub() },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'sessionId is required' },
      });
    });

    it('INVALID_MULTIPLE: {null query} => returns 400 with error', async () => {
      const proxy = SessionChatHistoryResponderProxy();

      const result = await proxy.callResponder({
        params: { sessionId: SessionIdStub() },
        query: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid query' },
      });
    });

    it('INVALID_MULTIPLE: {missing guildId query} => returns 400 with error', async () => {
      const proxy = SessionChatHistoryResponderProxy();

      const result = await proxy.callResponder({
        params: { sessionId: SessionIdStub() },
        query: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId query parameter is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = SessionChatHistoryResponderProxy();
      proxy.setupGuildError({ message: 'Guild not found' });

      const result = await proxy.callResponder({
        params: { sessionId: SessionIdStub() },
        query: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Guild not found' },
      });
    });
  });
});
