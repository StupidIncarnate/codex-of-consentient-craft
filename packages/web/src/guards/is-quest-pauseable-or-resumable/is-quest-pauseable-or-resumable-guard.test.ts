import { QuestStatusStub } from '@dungeonmaster/shared/contracts';

import { isQuestPauseableOrResumableGuard } from './is-quest-pauseable-or-resumable-guard';

type QuestStatus = ReturnType<typeof QuestStatusStub>;

describe('isQuestPauseableOrResumableGuard', () => {
  describe('pauseable statuses (seek_* and in_progress)', () => {
    it('VALID: {status: seek_scope} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'seek_scope' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: seek_synth} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'seek_synth' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: seek_walk} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'seek_walk' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: seek_plan} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'seek_plan' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: in_progress} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'in_progress' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(true);
    });
  });

  describe('resumable status (paused)', () => {
    it('VALID: {status: paused} => returns true', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'paused' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(true);
    });
  });

  describe('pre-execution spec statuses', () => {
    it('INVALID: {status: created} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'created' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: pending} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'pending' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: explore_flows} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'explore_flows' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: review_flows} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'review_flows' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: flows_approved} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'flows_approved' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: explore_observables} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'explore_observables' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: review_observables} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'review_observables' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: approved} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'approved' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: explore_design} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'explore_design' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: review_design} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'review_design' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: design_approved} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'design_approved' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });
  });

  describe('non-actionable terminal statuses', () => {
    it('INVALID: {status: blocked} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'blocked' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: complete} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'complete' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: abandoned} => returns false', () => {
      const status: QuestStatus = QuestStatusStub({ value: 'abandoned' });

      const result = isQuestPauseableOrResumableGuard({ status });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {status undefined} => returns false', () => {
      const result = isQuestPauseableOrResumableGuard({});

      expect(result).toBe(false);
    });
  });
});
