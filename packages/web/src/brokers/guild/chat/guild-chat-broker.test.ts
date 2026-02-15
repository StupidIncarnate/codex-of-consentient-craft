import {
  GuildIdStub,
  ProcessIdStub,
  SessionIdStub,
  UserInputStub,
} from '@dungeonmaster/shared/contracts';

import { guildChatBroker } from './guild-chat-broker';
import { guildChatBrokerProxy } from './guild-chat-broker.proxy';

describe('guildChatBroker', () => {
  describe('successful chat', () => {
    it('VALID: {guildId, message} => returns chatProcessId', async () => {
      const proxy = guildChatBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Set up CI pipeline' });
      const processId = ProcessIdStub({ value: 'chat-proc-123' });

      proxy.setupChat({ chatProcessId: processId });

      const result = await guildChatBroker({ guildId, message });

      expect(result).toStrictEqual({ chatProcessId: processId });
    });

    it('VALID: {guildId, message, sessionId} => returns chatProcessId', async () => {
      const proxy = guildChatBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Continue from last message' });
      const sessionId = SessionIdStub({ value: 'session-abc' });
      const processId = ProcessIdStub({ value: 'chat-proc-456' });

      proxy.setupChat({ chatProcessId: processId });

      const result = await guildChatBroker({ guildId, message, sessionId });

      expect(result).toStrictEqual({ chatProcessId: processId });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = guildChatBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Set up CI' });

      proxy.setupError();

      await expect(guildChatBroker({ guildId, message })).rejects.toThrow(/fetch/iu);
    });
  });
});
