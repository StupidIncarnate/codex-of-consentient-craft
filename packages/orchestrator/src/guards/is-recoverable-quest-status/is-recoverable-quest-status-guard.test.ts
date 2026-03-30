import { isRecoverableQuestStatusGuard } from './is-recoverable-quest-status-guard';

describe('isRecoverableQuestStatusGuard', () => {
  describe('recoverable statuses', () => {
    it('VALID: {status: created} => returns true', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'created' });

      expect(result).toBe(true);
    });

    it('VALID: {status: pending} => returns true', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'pending' });

      expect(result).toBe(true);
    });

    it('VALID: {status: explore_flows} => returns true', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'explore_flows' });

      expect(result).toBe(true);
    });

    it('VALID: {status: flows_approved} => returns true', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'flows_approved' });

      expect(result).toBe(true);
    });

    it('VALID: {status: explore_observables} => returns true', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'explore_observables' });

      expect(result).toBe(true);
    });

    it('VALID: {status: explore_design} => returns true', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'explore_design' });

      expect(result).toBe(true);
    });

    it('VALID: {status: in_progress} => returns true', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'in_progress' });

      expect(result).toBe(true);
    });

    it('VALID: {status: paused} => returns true', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'paused' });

      expect(result).toBe(true);
    });
  });

  describe('non-recoverable statuses', () => {
    it('VALID: {status: blocked} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'blocked' });

      expect(result).toBe(false);
    });

    it('VALID: {status: review_flows} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'review_flows' });

      expect(result).toBe(false);
    });

    it('VALID: {status: review_observables} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'review_observables' });

      expect(result).toBe(false);
    });

    it('VALID: {status: review_design} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'review_design' });

      expect(result).toBe(false);
    });

    it('VALID: {status: approved} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'approved' });

      expect(result).toBe(false);
    });

    it('VALID: {status: design_approved} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'design_approved' });

      expect(result).toBe(false);
    });

    it('VALID: {status: complete} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'complete' });

      expect(result).toBe(false);
    });

    it('VALID: {status: abandoned} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'abandoned' });

      expect(result).toBe(false);
    });
  });

  describe('undefined input', () => {
    it('EMPTY: {status: undefined} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({});

      expect(result).toBe(false);
    });
  });
});
