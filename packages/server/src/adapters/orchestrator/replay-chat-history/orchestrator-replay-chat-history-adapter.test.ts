import { GuildIdStub, ProcessIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorReplayChatHistoryAdapter } from './orchestrator-replay-chat-history-adapter';
import { orchestratorReplayChatHistoryAdapterProxy } from './orchestrator-replay-chat-history-adapter.proxy';

describe('orchestratorReplayChatHistoryAdapter', () => {
  describe('successful replay', () => {
    it('VALID: {sessionId, guildId, chatProcessId} => completes without error', async () => {
      orchestratorReplayChatHistoryAdapterProxy();

      await expect(
        orchestratorReplayChatHistoryAdapter({
          sessionId: SessionIdStub(),
          guildId: GuildIdStub(),
          chatProcessId: ProcessIdStub(),
        }),
      ).resolves.toBe(undefined);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorReplayChatHistoryAdapterProxy();

      proxy.setupFailure({ error: new Error('Replay failed') });

      await expect(
        orchestratorReplayChatHistoryAdapter({
          sessionId: SessionIdStub(),
          guildId: GuildIdStub(),
          chatProcessId: ProcessIdStub(),
        }),
      ).rejects.toThrow(/^Replay failed$/u);
    });
  });
});
