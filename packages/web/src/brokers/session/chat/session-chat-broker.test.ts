import {
  GuildIdStub,
  ProcessIdStub,
  SessionIdStub,
  UserInputStub,
} from '@dungeonmaster/shared/contracts';

import { sessionChatBroker } from './session-chat-broker';
import { sessionChatBrokerProxy } from './session-chat-broker.proxy';

describe('sessionChatBroker', () => {
  describe('with sessionId', () => {
    it('VALID: {sessionId, guildId, message} => returns chatProcessId via session endpoint', async () => {
      const proxy = sessionChatBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Continue the conversation' });
      const processId = ProcessIdStub({ value: 'chat-proc-123' });

      proxy.setupSessionChat({ chatProcessId: processId });

      const result = await sessionChatBroker({ sessionId, guildId, message });

      expect(result).toStrictEqual({ chatProcessId: processId });
    });
  });

  describe('without sessionId', () => {
    it('VALID: {guildId, message} => returns chatProcessId via guild endpoint', async () => {
      const proxy = sessionChatBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Start a new conversation' });
      const processId = ProcessIdStub({ value: 'chat-proc-456' });

      proxy.setupGuildChat({ chatProcessId: processId });

      const result = await sessionChatBroker({ guildId, message });

      expect(result).toStrictEqual({ chatProcessId: processId });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error with sessionId} => throws error', async () => {
      const proxy = sessionChatBrokerProxy();
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Send message' });

      proxy.setupError();

      await expect(sessionChatBroker({ sessionId, guildId, message })).rejects.toThrow(/fetch/iu);
    });

    it('ERROR: {server error without sessionId} => throws error', async () => {
      const proxy = sessionChatBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Send message' });

      proxy.setupError();

      await expect(sessionChatBroker({ guildId, message })).rejects.toThrow(/fetch/iu);
    });
  });
});
