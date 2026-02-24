import { GuildIdStub, ProcessIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';
import { SessionChatResponder } from './session-chat-responder';
import { SessionChatResponderProxy } from './session-chat-responder.proxy';

describe('SessionChatResponder', () => {
  describe('successful chat spawn', () => {
    it('VALID: {valid sessionId, message, guildId} => returns 200 with chatProcessId', async () => {
      const proxy = SessionChatResponderProxy();
      const chatProcessId = ProcessIdStub({ value: 'session-proc-001' });
      const sessionId = SessionIdStub();

      proxy.setupSessionChat({ chatProcessId });

      const result = await proxy.callResponder({
        params: { sessionId },
        body: { message: 'continue working', guildId: GuildIdStub() },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'session-proc-001' },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', async () => {
      SessionChatResponderProxy();

      const result = await SessionChatResponder({
        params: null,
        body: { message: 'hello', guildId: GuildIdStub() },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing sessionId} => returns 400 with error', async () => {
      SessionChatResponderProxy();

      const result = await SessionChatResponder({
        params: {},
        body: { message: 'hello', guildId: GuildIdStub() },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'sessionId is required' },
      });
    });

    it('INVALID_MULTIPLE: {null body} => returns 400 with error', async () => {
      SessionChatResponderProxy();

      const result = await SessionChatResponder({
        params: { sessionId: SessionIdStub() },
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID_MULTIPLE: {missing message} => returns 400 with error', async () => {
      SessionChatResponderProxy();

      const result = await SessionChatResponder({
        params: { sessionId: SessionIdStub() },
        body: { guildId: GuildIdStub() },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });

    it('INVALID_MULTIPLE: {missing guildId} => returns 400 with error', async () => {
      SessionChatResponderProxy();

      const result = await SessionChatResponder({
        params: { sessionId: SessionIdStub() },
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID_MULTIPLE: {empty message} => returns 400 with error', async () => {
      SessionChatResponderProxy();

      const result = await SessionChatResponder({
        params: { sessionId: SessionIdStub() },
        body: { message: '', guildId: GuildIdStub() },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = SessionChatResponderProxy();
      proxy.setupError({ message: 'Guild not found' });

      const result = await proxy.callResponder({
        params: { sessionId: SessionIdStub() },
        body: { message: 'hello', guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Guild not found' },
      });
    });
  });
});
