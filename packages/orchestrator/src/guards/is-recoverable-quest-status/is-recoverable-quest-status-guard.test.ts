import { isRecoverableQuestStatusGuard } from './is-recoverable-quest-status-guard';

describe('isRecoverableQuestStatusGuard', () => {
  describe('recoverable statuses', () => {
    it('VALID: {status: in_progress} => returns true', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'in_progress' });

      expect(result).toBe(true);
    });

    it('VALID: {status: blocked} => returns true', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'blocked' });

      expect(result).toBe(true);
    });
  });

  describe('non-recoverable statuses', () => {
    it('VALID: {status: created} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'created' });

      expect(result).toBe(false);
    });

    it('VALID: {status: approved} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'approved' });

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

    it('VALID: {status: explore_flows} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'explore_flows' });

      expect(result).toBe(false);
    });

    it('VALID: {status: design_approved} => returns false', () => {
      const result = isRecoverableQuestStatusGuard({ status: 'design_approved' });

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
