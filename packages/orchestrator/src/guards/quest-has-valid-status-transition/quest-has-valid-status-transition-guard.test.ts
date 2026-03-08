import { QuestStatusStub } from '@dungeonmaster/shared/contracts';

import { questHasValidStatusTransitionGuard } from './quest-has-valid-status-transition-guard';

describe('questHasValidStatusTransitionGuard', () => {
  describe('valid transitions', () => {
    it('VALID: {created -> explore_flows} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'created' }),
        nextStatus: QuestStatusStub({ value: 'explore_flows' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {explore_flows -> review_flows} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'explore_flows' }),
        nextStatus: QuestStatusStub({ value: 'review_flows' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {review_flows -> flows_approved} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'review_flows' }),
        nextStatus: QuestStatusStub({ value: 'flows_approved' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {review_flows -> explore_flows} => returns true (back-to-explore)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'review_flows' }),
        nextStatus: QuestStatusStub({ value: 'explore_flows' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {flows_approved -> explore_observables} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'flows_approved' }),
        nextStatus: QuestStatusStub({ value: 'explore_observables' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {explore_observables -> review_observables} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'explore_observables' }),
        nextStatus: QuestStatusStub({ value: 'review_observables' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {review_observables -> approved} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'review_observables' }),
        nextStatus: QuestStatusStub({ value: 'approved' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {review_observables -> explore_observables} => returns true (back-to-explore)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'review_observables' }),
        nextStatus: QuestStatusStub({ value: 'explore_observables' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {approved -> in_progress} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'approved' }),
        nextStatus: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {approved -> explore_design} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'approved' }),
        nextStatus: QuestStatusStub({ value: 'explore_design' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {explore_design -> review_design} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'explore_design' }),
        nextStatus: QuestStatusStub({ value: 'review_design' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {review_design -> design_approved} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'review_design' }),
        nextStatus: QuestStatusStub({ value: 'design_approved' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {review_design -> explore_design} => returns true (back-to-explore)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'review_design' }),
        nextStatus: QuestStatusStub({ value: 'explore_design' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {design_approved -> in_progress} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'design_approved' }),
        nextStatus: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {in_progress -> complete} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'in_progress' }),
        nextStatus: QuestStatusStub({ value: 'complete' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {in_progress -> blocked} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'in_progress' }),
        nextStatus: QuestStatusStub({ value: 'blocked' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {in_progress -> abandoned} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'in_progress' }),
        nextStatus: QuestStatusStub({ value: 'abandoned' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {blocked -> in_progress} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'blocked' }),
        nextStatus: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {blocked -> abandoned} => returns true', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'blocked' }),
        nextStatus: QuestStatusStub({ value: 'abandoned' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('invalid transitions', () => {
    it('INVALID: {created -> flows_approved} => returns false (skips explore/review)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'created' }),
        nextStatus: QuestStatusStub({ value: 'flows_approved' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {flows_approved -> approved} => returns false (skips explore/review observables)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'flows_approved' }),
        nextStatus: QuestStatusStub({ value: 'approved' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {created -> approved} => returns false (skips multiple steps)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'created' }),
        nextStatus: QuestStatusStub({ value: 'approved' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {created -> in_progress} => returns false (skips multiple steps)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'created' }),
        nextStatus: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {complete -> in_progress} => returns false (terminal state)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'complete' }),
        nextStatus: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {explore_design -> in_progress} => returns false (skips review/approval)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'explore_design' }),
        nextStatus: QuestStatusStub({ value: 'in_progress' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {design_approved -> explore_design} => returns false (cannot go back after approval)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'design_approved' }),
        nextStatus: QuestStatusStub({ value: 'explore_design' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {abandoned -> created} => returns false (terminal state)', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'abandoned' }),
        nextStatus: QuestStatusStub({ value: 'created' }),
      });

      expect(result).toBe(false);
    });
  });

  describe('missing inputs', () => {
    it('INVALID: {currentStatus undefined} => returns false', () => {
      const result = questHasValidStatusTransitionGuard({
        nextStatus: QuestStatusStub({ value: 'flows_approved' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {nextStatus undefined} => returns false', () => {
      const result = questHasValidStatusTransitionGuard({
        currentStatus: QuestStatusStub({ value: 'created' }),
      });

      expect(result).toBe(false);
    });

    it('INVALID: {both undefined} => returns false', () => {
      const result = questHasValidStatusTransitionGuard({});

      expect(result).toBe(false);
    });
  });
});
