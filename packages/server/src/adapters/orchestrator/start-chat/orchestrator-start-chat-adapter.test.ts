import { GuildIdStub } from '@dungeonmaster/shared/contracts';

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
