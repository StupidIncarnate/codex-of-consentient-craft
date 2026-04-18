import { isRecoverableQuestStatusGuard } from './is-recoverable-quest-status-guard';

describe('isRecoverableQuestStatusGuard', () => {
  describe('recoverable statuses', () => {
    it.each([
      'created',
      'pending',
      'explore_flows',
      'flows_approved',
      'explore_observables',
      'explore_design',
      'seek_scope',
      'seek_synth',
      'seek_walk',
      'seek_plan',
      'in_progress',
    ] as const)('VALID: {status: %s} => returns true', (status) => {
      const result = isRecoverableQuestStatusGuard({ status });

      expect(result).toBe(true);
    });
  });

  describe('non-recoverable statuses', () => {
    it.each([
      'paused',
      'blocked',
      'review_flows',
      'review_observables',
      'review_design',
      'approved',
      'design_approved',
      'complete',
      'abandoned',
    ] as const)('VALID: {status: %s} => returns false', (status) => {
      const result = isRecoverableQuestStatusGuard({ status });

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
