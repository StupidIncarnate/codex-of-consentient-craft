import { GuildIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorStartChatAdapter } from './orchestrator-start-chat-adapter';
import { orchestratorStartChatAdapterProxy } from './orchestrator-start-chat-adapter.proxy';

describe('orchestratorStartChatAdapter', () => {
  describe('successful start', () => {
    it('VALID: {guildId, message} => returns chatProcessId', async () => {
      orchestratorStartChatAdapterProxy();
      const guildId = GuildIdStub();

      const result = await orchestratorStartChatAdapter({ guildId, message: 'hello' });

      expect(result).toStrictEqual({ chatProcessId: 'proc-12345' });
    });

    it('VALID: {guildId, message, sessionId} => forwards sessionId to orchestrator', async () => {
      const proxy = orchestratorStartChatAdapterProxy();
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'session-resume-123' });

      await orchestratorStartChatAdapter({ guildId, message: 'continue', sessionId });

      expect(proxy.getLastCalledArgs()).toStrictEqual({
        guildId,
        message: 'continue',
        sessionId,
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorStartChatAdapterProxy();
      const guildId = GuildIdStub();

      proxy.throws({ error: new Error('Failed to start chat') });

      await expect(orchestratorStartChatAdapter({ guildId, message: 'hello' })).rejects.toThrow(
        /Failed to start chat/u,
      );
    });
  });
});
