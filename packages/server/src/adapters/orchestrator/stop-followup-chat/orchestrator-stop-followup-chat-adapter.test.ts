import { QuestIdStub } from '@dungeonmaster/shared/contracts';
import { orchestratorStopFollowupChatAdapter } from './orchestrator-stop-followup-chat-adapter';
import { orchestratorStopFollowupChatAdapterProxy } from './orchestrator-stop-followup-chat-adapter.proxy';

describe('orchestratorStopFollowupChatAdapter', () => {
  describe('successful call', () => {
    it('VALID: {questId with a running tavernkeeper} => returns stopped true', async () => {
      const proxy = orchestratorStopFollowupChatAdapterProxy();
      const questId = QuestIdStub();
      proxy.returns({ questId, stopped: true });

      const result = await orchestratorStopFollowupChatAdapter({ questId });

      expect(result).toStrictEqual({ stopped: true });
    });

    it('EMPTY: {questId with nothing running} => returns stopped false', async () => {
      const proxy = orchestratorStopFollowupChatAdapterProxy();
      const questId = QuestIdStub();
      proxy.returns({ questId, stopped: false });

      const result = await orchestratorStopFollowupChatAdapter({ questId });

      expect(result).toStrictEqual({ stopped: false });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorStopFollowupChatAdapterProxy();
      const questId = QuestIdStub();
      proxy.throws({ questId, error: new Error('Quest not found: q-1') });

      await expect(orchestratorStopFollowupChatAdapter({ questId })).rejects.toThrow(
        /Quest not found: q-1/u,
      );
    });
  });
});
