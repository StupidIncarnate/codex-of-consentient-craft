import { QuestStatusStub } from '@dungeonmaster/shared/contracts';

import { isDesignTabVisibleGuard } from './is-design-tab-visible-guard';

describe('isDesignTabVisibleGuard', () => {
  describe('design statuses', () => {
    it('VALID: {status: explore_design} => returns true', () => {
      const status = QuestStatusStub({ value: 'explore_design' });

      const result = isDesignTabVisibleGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: review_design} => returns true', () => {
      const status = QuestStatusStub({ value: 'review_design' });

      const result = isDesignTabVisibleGuard({ status });

      expect(result).toBe(true);
    });

    it('VALID: {status: design_approved} => returns true', () => {
      const status = QuestStatusStub({ value: 'design_approved' });

      const result = isDesignTabVisibleGuard({ status });

      expect(result).toBe(true);
    });
  });

  describe('non-design statuses', () => {
    it('INVALID: {status: created} => returns false', () => {
      const status = QuestStatusStub({ value: 'created' });

      const result = isDesignTabVisibleGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: approved} => returns false', () => {
      const status = QuestStatusStub({ value: 'approved' });

      const result = isDesignTabVisibleGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: in_progress} => returns false', () => {
      const status = QuestStatusStub({ value: 'in_progress' });

      const result = isDesignTabVisibleGuard({ status });

      expect(result).toBe(false);
    });

    it('INVALID: {status: explore_flows} => returns false', () => {
      const status = QuestStatusStub({ value: 'explore_flows' });

      const result = isDesignTabVisibleGuard({ status });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {status undefined} => returns false', () => {
      const result = isDesignTabVisibleGuard({});

      expect(result).toBe(false);
    });
  });
});
