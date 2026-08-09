import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { QuestFollowupResponder } from './quest-followup-responder';
import { QuestFollowupResponderProxy } from './quest-followup-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const FOLLOWUP_ALLOWED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isFollowupChatable,
);

const FOLLOWUP_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(FOLLOWUP_ALLOWED_STATUSES);

const FOLLOWUP_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !FOLLOWUP_ALLOWED_SET.has(status),
);

const FOLLOWUP_REJECTED_ERROR = 'Quest must be blocked, complete or merged for follow-up';

describe('QuestFollowupResponder', () => {
  describe('successful follow-up chat', () => {
    it('VALID: {complete quest, message in body} => returns 200 with chatProcessId and delegates the exact {questId, guildId, message}', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-complete-followup' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-followup' });
      const quest = QuestStub({ id: questId, status: 'complete' });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId });
      proxy.setupStartFollowupChat({ questId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'What was blocking this quest?' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-followup' },
      });
      expect(proxy.getStartFollowupChatCalls()).toStrictEqual([
        { questId, guildId, message: 'What was blocking this quest?' },
      ]);
    });

    it('VALID: {merged quest} => returns 200 with chatProcessId', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-merged-followup' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-merged' });
      const quest = QuestStub({ id: questId, status: 'merged' });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId });
      proxy.setupStartFollowupChat({ questId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'Can you explain what shipped in the merge?' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-merged' },
      });
    });
  });

  describe('status gate', () => {
    // A gate that only proved it ACCEPTS blocked/complete/merged would still pass while also
    // accepting paused/approved/abandoned — so both halves of the matrix are derived from the
    // SAME statics source (see get-testing-patterns "Subset-membership expected values").
    it.each(FOLLOWUP_ALLOWED_STATUSES)(
      'VALID: {status: %s} => returns 200 with chatProcessId',
      async (status) => {
        const proxy = QuestFollowupResponderProxy();
        const questId = QuestIdStub();
        const guildId = GuildIdStub();
        const chatProcessId = ProcessIdStub();
        const quest = QuestStub({ id: questId, status });

        proxy.setupQuestLoad({ quest });
        proxy.setupFindQuestPath({ questId, guildId });
        proxy.setupStartFollowupChat({ questId, chatProcessId });

        const result = await proxy.callResponder({
          params: { questId },
          body: { message: 'Follow-up question' },
        });

        expect(result).toStrictEqual({
          status: 200,
          data: { chatProcessId },
        });
      },
    );

    it.each(FOLLOWUP_REJECTED_STATUSES)(
      'INVALID: {status: %s} => returns 400 and never calls the start-followup-chat adapter',
      async (status) => {
        const proxy = QuestFollowupResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ id: questId, status });

        proxy.setupQuestLoad({ quest });

        const result = await proxy.callResponder({
          params: { questId },
          body: { message: 'Follow-up question' },
        });

        expect(result).toStrictEqual({
          status: 400,
          data: { error: FOLLOWUP_REJECTED_ERROR },
        });
        expect(proxy.getStartFollowupChatCalls()).toStrictEqual([]);
      },
    );
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      QuestFollowupResponderProxy();

      const result = await QuestFollowupResponder({ params: null, body: { message: 'hi' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      QuestFollowupResponderProxy();

      const result = await QuestFollowupResponder({ params: {}, body: { message: 'hi' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {null body} => returns 400', async () => {
      QuestFollowupResponderProxy();

      const result = await QuestFollowupResponder({
        params: { questId: QuestIdStub() },
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID: {missing message in body} => returns 400', async () => {
      QuestFollowupResponderProxy();

      const result = await QuestFollowupResponder({
        params: { questId: QuestIdStub() },
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });
  });

  describe('orchestrator failures', () => {
    it('ERROR: {start-followup-chat adapter throws worktree-not-found} => returns 500 naming the absolute worktree path', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-missing-worktree' });
      const guildId = GuildIdStub();
      const quest = QuestStub({ id: questId, status: 'blocked' });
      const worktreeNotFoundMessage = `Cannot start chat for quest ${questId}: worktree not found: /home/dm/.dungeonmaster/worktrees/${questId}`;

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId });
      proxy.setupStartFollowupChatError({ questId, error: new Error(worktreeNotFoundMessage) });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'Why did this quest block?' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: worktreeNotFoundMessage },
      });
    });
  });
});
