import {
  CommentBatchEntryStub,
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { orchestratorCommentBatchAdapter } from './orchestrator-comment-batch-adapter';
import { orchestratorCommentBatchAdapterProxy } from './orchestrator-comment-batch-adapter.proxy';

describe('orchestratorCommentBatchAdapter', () => {
  describe('successful delivery', () => {
    it('VALID: {guildId, sessionId, questId, comments} => returns chatProcessId', async () => {
      const proxy = orchestratorCommentBatchAdapterProxy();
      const questId = QuestIdStub();
      const chatProcessId = ProcessIdStub({ value: 'comment-process-123' });
      proxy.returns({ questId, chatProcessId });

      const result = await orchestratorCommentBatchAdapter({
        guildId: GuildIdStub(),
        sessionId: SessionIdStub(),
        questId,
        comments: [CommentBatchEntryStub()],
      });

      expect(result).toStrictEqual({ chatProcessId: 'comment-process-123' });
    });

    it('VALID: {comments} => forwards the batch verbatim to the orchestrator', async () => {
      const proxy = orchestratorCommentBatchAdapterProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub();
      const comment = CommentBatchEntryStub({ observableId: 'login-redirects-to-dashboard' });
      proxy.returns({ questId, chatProcessId: ProcessIdStub({ value: 'comment-process-123' }) });

      await orchestratorCommentBatchAdapter({
        guildId,
        sessionId,
        questId,
        comments: [comment],
      });

      expect(proxy.getLastCalledArgs({ questId })).toStrictEqual({
        guildId,
        sessionId,
        questId,
        comments: [comment],
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {orchestrator throws} => propagates error', async () => {
      const proxy = orchestratorCommentBatchAdapterProxy();
      const questId = QuestIdStub();
      proxy.throws({ questId, error: new Error('Failed to persist comment batch') });

      await expect(
        orchestratorCommentBatchAdapter({
          guildId: GuildIdStub(),
          sessionId: SessionIdStub(),
          questId,
          comments: [CommentBatchEntryStub()],
        }),
      ).rejects.toThrow(/Failed to persist comment batch/u);
    });
  });
});
