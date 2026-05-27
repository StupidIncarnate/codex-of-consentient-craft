import {
  AgentIdStub,
  GuildIdStub,
  ProcessIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

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
      ).resolves.toStrictEqual({ success: true });
    });
  });

  describe('agentId forwarding', () => {
    it('VALID: {agentId param} => forwards agentId to StartOrchestrator.replayChatHistory', async () => {
      const proxy = orchestratorReplayChatHistoryAdapterProxy();
      const sessionId = SessionIdStub({ value: '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402' });
      const agentId = AgentIdStub({ value: 'acd35f7b7763e33e8' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-agent' });

      await orchestratorReplayChatHistoryAdapter({
        sessionId,
        agentId,
        guildId,
        chatProcessId,
      });

      expect(proxy.getAllCalledArgs()).toStrictEqual([
        { sessionId, agentId, guildId, chatProcessId },
      ]);
    });

    it('VALID: {no agentId} => omits agentId from orchestrator call', async () => {
      const proxy = orchestratorReplayChatHistoryAdapterProxy();
      const sessionId = SessionIdStub({ value: 'session-no-agent' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'replay-no-agent' });

      await orchestratorReplayChatHistoryAdapter({
        sessionId,
        guildId,
        chatProcessId,
      });

      expect(proxy.getAllCalledArgs()).toStrictEqual([{ sessionId, guildId, chatProcessId }]);
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
