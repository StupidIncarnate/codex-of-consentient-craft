import { QuestStub, SessionIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { isCommentComposeAllowedGuard } from './is-comment-compose-allowed-guard';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const BEFORE_SPEC_APPROVED_STATUSES: ReadonlySet<StatusKey> = new Set(
  STATUSES.filter((status) => questStatusMetadataStatics.statuses[status].isBeforeSpecApproved),
);

describe('isCommentComposeAllowedGuard', () => {
  describe('empty inputs', () => {
    it('EMPTY: {quest: undefined} => returns false', () => {
      const result = isCommentComposeAllowedGuard({});

      expect(result).toBe(false);
    });
  });

  describe('both gates open', () => {
    it('VALID: {status: review_flows, chaoswhisperer work item with sessionId} => returns true', () => {
      const quest = QuestStub({
        status: 'review_flows',
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });

      const result = isCommentComposeAllowedGuard({ quest });

      expect(result).toBe(true);
    });

    it('VALID: {status: review_observables, glyphsmith work item with sessionId} => returns true', () => {
      const quest = QuestStub({
        status: 'review_observables',
        workItems: [WorkItemStub({ role: 'glyphsmith', sessionId: SessionIdStub() })],
      });

      const result = isCommentComposeAllowedGuard({ quest });

      expect(result).toBe(true);
    });
  });

  describe('status gate closed', () => {
    it('INVALID: {status: approved, chaoswhisperer work item with sessionId} => returns false', () => {
      const quest = QuestStub({
        status: 'approved',
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });

      const result = isCommentComposeAllowedGuard({ quest });

      expect(result).toBe(false);
    });

    it('INVALID: {status: complete, chaoswhisperer work item with sessionId} => returns false', () => {
      const quest = QuestStub({
        status: 'complete',
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });

      const result = isCommentComposeAllowedGuard({ quest });

      expect(result).toBe(false);
    });
  });

  describe('session gate closed', () => {
    it('INVALID: {status: review_flows, no work item carrying a sessionId} => returns false', () => {
      const quest = QuestStub({ status: 'review_flows', workItems: [] });

      const result = isCommentComposeAllowedGuard({ quest });

      expect(result).toBe(false);
    });

    it('INVALID: {status: review_flows, codeweaver work item with sessionId} => returns false', () => {
      const quest = QuestStub({
        status: 'review_flows',
        workItems: [WorkItemStub({ role: 'codeweaver', sessionId: SessionIdStub() })],
      });

      const result = isCommentComposeAllowedGuard({ quest });

      expect(result).toBe(false);
    });
  });

  describe('state matrix across every quest status', () => {
    it.each(STATUSES)(
      'VALID: {status: %s, resumable session present} => returns expected flag',
      (status) => {
        const expected = BEFORE_SPEC_APPROVED_STATUSES.has(status);
        const quest = QuestStub({
          status,
          workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
        });

        const result = isCommentComposeAllowedGuard({ quest });

        expect(result).toBe(expected);
      },
    );
  });
});
