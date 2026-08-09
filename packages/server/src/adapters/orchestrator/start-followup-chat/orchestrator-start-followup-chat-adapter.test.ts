import { GuildIdStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { orchestratorStartFollowupChatAdapter } from './orchestrator-start-followup-chat-adapter';
import { orchestratorStartFollowupChatAdapterProxy } from './orchestrator-start-followup-chat-adapter.proxy';

describe('orchestratorStartFollowupChatAdapter', () => {
  describe('successful call', () => {
    it('VALID: {questId, guildId, message} => returns chatProcessId', async () => {
      const proxy = orchestratorStartFollowupChatAdapterProxy();
      const questId = QuestIdStub();
      const chatProcessId = ProcessIdStub();
      proxy.returns({ questId, chatProcessId });

      const result = await orchestratorStartFollowupChatAdapter({
        questId,
        guildId: GuildIdStub(),
        message: 'What was blocking this quest?',
      });

      expect(result).toStrictEqual({ chatProcessId });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorStartFollowupChatAdapterProxy();
      const questId = QuestIdStub();
      proxy.throws({ questId, error: new Error('Follow-up chat failed') });

      await expect(
        orchestratorStartFollowupChatAdapter({
          questId,
          guildId: GuildIdStub(),
          message: 'What was blocking this quest?',
        }),
      ).rejects.toThrow(/Follow-up chat failed/u);
    });
  });
});
