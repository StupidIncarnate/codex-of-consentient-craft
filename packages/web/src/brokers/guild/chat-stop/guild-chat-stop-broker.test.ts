import { GuildIdStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { guildChatStopBroker } from './guild-chat-stop-broker';
import { guildChatStopBrokerProxy } from './guild-chat-stop-broker.proxy';

describe('guildChatStopBroker', () => {
  describe('successful stop', () => {
    it('VALID: {guildId, chatProcessId} => returns stopped true', async () => {
      const proxy = guildChatStopBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });

      proxy.setupStop();

      const result = await guildChatStopBroker({ guildId, chatProcessId });

      expect(result).toStrictEqual({ stopped: true });
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = guildChatStopBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });

      proxy.setupError();

      await expect(guildChatStopBroker({ guildId, chatProcessId })).rejects.toThrow(/fetch/iu);
    });
  });
});
