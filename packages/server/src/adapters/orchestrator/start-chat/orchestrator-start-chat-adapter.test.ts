import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

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

    it('VALID: {guildId, message, no sessionId} => returns chatProcessId AND questId when adapter supplies questId', async () => {
      const proxy = orchestratorStartChatAdapterProxy();
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-with-quest' });
      const questId = QuestIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.returns({ chatProcessId, questId });

      const result = await orchestratorStartChatAdapter({ guildId, message: 'hello' });

      expect(result).toStrictEqual({
        chatProcessId: 'proc-with-quest',
        questId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
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
