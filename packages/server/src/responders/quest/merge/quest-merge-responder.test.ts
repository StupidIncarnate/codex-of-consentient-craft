import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { QuestMergeResponderProxy } from './quest-merge-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const MERGE_ALLOWED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isMergeable,
);

const MERGE_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(MERGE_ALLOWED_STATUSES);

const MERGE_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !MERGE_ALLOWED_SET.has(status),
);

const MERGE_REJECTED_ERROR = 'Quest must be blocked or complete to merge';

describe('QuestMergeResponder', () => {
  describe('successful merge', () => {
    it('VALID: {complete quest} => returns 200 { merging: true } and delegates the exact { questId }', async () => {
      const proxy = QuestMergeResponderProxy();
      const questId = QuestIdStub({ value: 'quest-complete-merge' });
      const quest = QuestStub({ id: questId, status: 'complete' });

      proxy.setupQuest({ quest });
      proxy.setupMergeQuest({ questId, merging: true });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 200,
        data: { merging: true },
      });
      expect(proxy.getMergeQuestCalls()).toStrictEqual([{ questId }]);
    });

    it('VALID: {blocked quest} => returns 200 { merging: true }', async () => {
      const proxy = QuestMergeResponderProxy();
      const questId = QuestIdStub({ value: 'quest-blocked-merge' });
      const quest = QuestStub({ id: questId, status: 'blocked' });

      proxy.setupQuest({ quest });
      proxy.setupMergeQuest({ questId, merging: true });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 200,
        data: { merging: true },
      });
    });
  });

  describe('status gate', () => {
    // A gate that only proved it ACCEPTS blocked/complete would still pass while also accepting
    // paused/approved/abandoned — so both halves of the matrix are derived from the SAME statics
    // source (see get-testing-patterns "Subset-membership expected values"). `merged` MUST fall
    // in the rejected half: a merged quest has nothing left to send home.
    it.each(MERGE_ALLOWED_STATUSES)('VALID: {status: %s} => returns 200', async (status) => {
      const proxy = QuestMergeResponderProxy();
      const questId = QuestIdStub();
      const quest = QuestStub({ id: questId, status });

      proxy.setupQuest({ quest });
      proxy.setupMergeQuest({ questId, merging: true });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 200,
        data: { merging: true },
      });
    });

    it.each(MERGE_REJECTED_STATUSES)(
      'INVALID: {status: %s} => returns 400 and never calls the merge adapter',
      async (status) => {
        const proxy = QuestMergeResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ id: questId, status });

        proxy.setupQuest({ quest });

        const result = await proxy.callResponder({ params: { questId } });

        expect(result).toStrictEqual({
          status: 400,
          data: { error: MERGE_REJECTED_ERROR },
        });
        expect(proxy.getMergeQuestCalls()).toStrictEqual([]);
      },
    );
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      const proxy = QuestMergeResponderProxy();

      const result = await proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      const proxy = QuestMergeResponderProxy();

      const result = await proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });
  });

  describe('orchestrator failures', () => {
    it('ERROR: {quest not found} => returns 400 and never calls the merge adapter', async () => {
      const proxy = QuestMergeResponderProxy();
      const questId = QuestIdStub({ value: 'quest-missing-merge' });

      proxy.setupQuestNotFound({ questId });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Quest not found' },
      });
      expect(proxy.getMergeQuestCalls()).toStrictEqual([]);
    });

    it('ERROR: {merge adapter throws} => returns 500 carrying the thrown message', async () => {
      const proxy = QuestMergeResponderProxy();
      const questId = QuestIdStub({ value: 'quest-merge-throws' });
      const quest = QuestStub({ id: questId, status: 'blocked' });

      proxy.setupQuest({ quest });
      proxy.setupMergeQuestError({
        questId,
        message: `Failed to start merge: worktree not found for quest ${questId}`,
      });

      const result = await proxy.callResponder({ params: { questId } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: `Failed to start merge: worktree not found for quest ${questId}` },
      });
    });
  });
});
