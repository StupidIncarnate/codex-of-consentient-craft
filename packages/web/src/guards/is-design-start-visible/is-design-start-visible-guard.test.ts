import { QuestStub } from '@dungeonmaster/shared/contracts';

import { isDesignStartVisibleGuard } from './is-design-start-visible-guard';

describe('isDesignStartVisibleGuard', () => {
  describe('visible conditions', () => {
    it('VALID: {status: approved, needsDesign: true} => returns true', () => {
      const quest = QuestStub({ status: 'approved', needsDesign: true });

      const result = isDesignStartVisibleGuard({ quest });

      expect(result).toBe(true);
    });
  });

  describe('hidden conditions', () => {
    it('INVALID: {status: approved, needsDesign: false} => returns false', () => {
      const quest = QuestStub({ status: 'approved', needsDesign: false });

      const result = isDesignStartVisibleGuard({ quest });

      expect(result).toBe(false);
    });

    it('INVALID: {status: created, needsDesign: true} => returns false', () => {
      const quest = QuestStub({ status: 'created', needsDesign: true });

      const result = isDesignStartVisibleGuard({ quest });

      expect(result).toBe(false);
    });

    it('INVALID: {status: in_progress, needsDesign: true} => returns false', () => {
      const quest = QuestStub({ status: 'in_progress', needsDesign: true });

      const result = isDesignStartVisibleGuard({ quest });

      expect(result).toBe(false);
    });

    it('INVALID: {status: explore_design, needsDesign: true} => returns false', () => {
      const quest = QuestStub({ status: 'explore_design', needsDesign: true });

      const result = isDesignStartVisibleGuard({ quest });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {quest undefined} => returns false', () => {
      const result = isDesignStartVisibleGuard({});

      expect(result).toBe(false);
    });
  });
});
